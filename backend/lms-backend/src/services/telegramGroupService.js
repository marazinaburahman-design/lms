const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const Course = require('../models/Course');

let client;
async function getClient() {
  if (client) return client;
  client = new TelegramClient(
    new StringSession(process.env.TELEGRAM_SESSION),
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
  );
  await client.connect();
  return client;
}

// 0771234567 / +94771234567 / 94771234567 -> +94771234567
function toInternational(num) {
  let d = String(num || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '94' + d.slice(1);
  return '+' + d;
}

// Creates a supergroup titled with the course name and makes the bot an admin.
async function createCourseGroup(courseName) {
  const c = await getClient();
  const res = await c.invoke(
    new Api.channels.CreateChannel({
      title: courseName,
      about: `Official group for ${courseName}`,
      megagroup: true,
    })
  );
  const channel = res.chats[0];

  await c.invoke(
    new Api.channels.EditAdmin({
      channel,
      userId: process.env.TELEGRAM_BOT_USERNAME,
      adminRights: new Api.ChatAdminRights({ inviteUsers: true }),
      rank: 'bot',
    })
  );
  return `-100${channel.id}`;
}

// Returns the course's group, creating it only once (safe for simultaneous enrollments).
async function getOrCreateCourseGroup(courseId) {
  let course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');
  if (course.telegramGroupId) return course.telegramGroupId;

  const claimed = await Course.findOneAndUpdate(
    { _id: courseId, telegramGroupId: { $exists: false }, telegramGroupCreating: { $ne: true } },
    { $set: { telegramGroupCreating: true } },
    { new: true }
  );

  if (claimed) {
    try {
      const groupId = await createCourseGroup(claimed.name);
      await Course.updateOne(
        { _id: courseId },
        { $set: { telegramGroupId: groupId }, $unset: { telegramGroupCreating: 1 } }
      );
      return groupId;
    } catch (err) {
      await Course.updateOne({ _id: courseId }, { $unset: { telegramGroupCreating: 1 } });
      throw err;
    }
  }

  // Another request is creating it: wait up to ~15 s
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    course = await Course.findById(courseId);
    if (course.telegramGroupId) return course.telegramGroupId;
  }
  throw new Error('Telegram group is still being created, try again');
}

// Adds a student to the group using their Telegram number.
async function addStudentByNumber(groupId, student) {
  const c = await getClient();
  const imported = await c.invoke(
    new Api.contacts.ImportContacts({
      contacts: [
        new Api.InputPhoneContact({
          clientId: BigInt(Date.now()),
          phone: toInternational(student.telegramNumber),
          firstName: student.firstName,
          lastName: student.lastName || '',
        }),
      ],
    })
  );
  if (!imported.users.length) throw new Error('This number is not on Telegram');

  await c.getDialogs({ limit: 100 }); // fills the entity cache after a restart
  const channel = await c.getInputEntity(
    new Api.PeerChannel({ channelId: BigInt(String(groupId).replace('-100', '')) })
  );
  await c.invoke(new Api.channels.InviteToChannel({ channel, users: [imported.users[0]] }));
  return true;
}

// One-time invite link (fallback when adding by number fails).
async function createInviteLink(groupId, studentName) {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/createChatInviteLink`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: groupId, member_limit: 1, name: studentName }),
    }
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Could not create invite link');
  return data.result.invite_link;
}

// Full flow for one enrollment. Never throws.
async function joinCourseGroup(courseId, student) {
  if (process.env.TELEGRAM_ENABLED !== 'true' || !process.env.TELEGRAM_SESSION) {
    return { status: 'skipped', reason: 'Telegram group automation is not configured' };
  }
  if (!student.telegramNumber) {
    return { status: 'skipped', reason: 'Student has no Telegram number' };
  }

  try {
    const groupId = await getOrCreateCourseGroup(courseId);
    try {
      await addStudentByNumber(groupId, student);
      return { status: 'added', groupId };
    } catch (err) {
      const link = await createInviteLink(groupId, student.firstName);
      return { status: 'invite_link', groupId, link, reason: err.message };
    }
  } catch (err) {
    return { status: 'failed', reason: err.message };
  }
}

module.exports = {
  createCourseGroup,
  getOrCreateCourseGroup,
  addStudentByNumber,
  createInviteLink,
  joinCourseGroup,
};