const cron = require('node-cron');
const ClassSession = require('../models/ClassSession');

const TZ = 'Asia/Colombo';
const ACADEMY_NAME = 'Marazin Academy';
const LEAD_MINUTES = Number(process.env.ZOOM_LEAD_MINUTES || 15);
const LATE_WINDOW_MINUTES = 60;

async function sendToGroup(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
  if (!chatId) throw new Error('No Telegram group is configured for this class');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram: ${data.description}`);
  return data;
}

function colomboNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '15:15').split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatTime(hhmm) {
  const [h, m] = String(hhmm || '15:15').split(':').map(Number);
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatMeetingId(id) {
  const digits = String(id || '').replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return String(id || '');
}

function formatDate(date) {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function buildMessage(s) {
  const lines = [
    `You have a class at ${formatTime(s.startTime)}`,
    '',
    `${ACADEMY_NAME} is inviting you to a scheduled Zoom meeting.`,
    s.course?.name ? `Course: ${s.course.name}` : '',
    s.batch?.name ? `Batch: ${s.batch.name}` : '',
    `Topic: ${s.topic}`,
    s.mentorName ? `Mentor: ${s.mentorName}` : '',
    `Time: ${formatDate(s.date)} ${formatTime(s.startTime)} Colombo`,
    '',
    'Join Zoom Meeting',
    s.zoomJoinUrl,
    '',
    s.zoomMeetingId ? `Meeting ID: ${formatMeetingId(s.zoomMeetingId)}` : '',
    s.zoomPasscode ? `Passcode: ${s.zoomPasscode}` : '',
  ];
  return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n').trim();
}

async function sendSession(session) {
  const s = session.course?.telegramGroupId || session.batch?.telegramGroupId;
  if (!s) throw new Error(`No Telegram group configured for ${session.course?.name || 'this course'}`);
  if (!session.zoomJoinUrl) throw new Error('This class session has no Zoom join URL');
  await sendToGroup(s, buildMessage(session));
}

async function sendDueSessions() {
  const { date, minutes } = colomboNow();
  const candidates = await ClassSession.find({
    date,
    cancelled: { $ne: true },
    linkSent: { $ne: true },
    zoomJoinUrl: { $exists: true, $ne: '' },
  }).populate('course', 'name code telegramGroupId').populate('batch', 'name telegramGroupId');

  const due = candidates.filter((s) => {
    const start = toMinutes(s.startTime);
    return minutes >= start - LEAD_MINUTES && minutes <= start + LATE_WINDOW_MINUTES;
  });

  let sent = 0;
  for (const s of due) {
    const claimed = await ClassSession.findOneAndUpdate(
      { _id: s._id, linkSent: { $ne: true } },
      { $set: { linkSent: true, sentAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;
    try {
      await sendSession(s);
      sent++;
      console.log(`[zoom-link] sent: ${s.course?.name} - ${s.topic}`);
    } catch (err) {
      await ClassSession.updateOne({ _id: s._id }, { $set: { linkSent: false }, $unset: { sentAt: 1 } });
      console.error(`[zoom-link] failed: ${s.course?.name} - ${s.topic}:`, err.message);
    }
  }
  return { checked: candidates.length, due: due.length, sent };
}

function startZoomLinkScheduler() {
  cron.schedule('* * * * *', () => sendDueSessions().catch((err) => console.error('[zoom-link] job error:', err.message)), { timezone: TZ });
  console.log(`Zoom/Telegram scheduler started: every minute, ${LEAD_MINUTES} min before class (${TZ})`);
}

module.exports = { startZoomLinkScheduler, sendDueSessions, sendSession };
