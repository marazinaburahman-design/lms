const ClassSession = require('../models/ClassSession');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const { createMeeting } = require('./zoomService');

const DAY_NAMES = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function pad(n) { return String(n).padStart(2, '0'); }

function parseTime(text) {
  const value = String(text || '').trim();
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59) return null;
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (hour > 23) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

function parseSchedule(schedule) {
  const raw = String(schedule || '').trim();
  if (!raw) return { weekdays: [], startTime: null };

  const parts = raw.split(/\s*(?:-|–|—|at)\s*/i);
  const dayPart = parts[0] || raw;
  const timePart = parts.slice(1).join(' ') || raw.match(/\d{1,2}(?::\d{2})?\s*(?:AM|PM)?/i)?.[0];

  const weekdays = dayPart
    .split(/[,/]+|\s+(?=Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i)
    .map((x) => x.trim().toLowerCase())
    .map((x) => DAY_NAMES[x])
    .filter((x) => x !== undefined);

  return { weekdays: [...new Set(weekdays)], startTime: parseTime(timePart) };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getSessionDates(batch) {
  const explicit = batch.classDate ? String(batch.classDate).slice(0, 10) : null;
  const start = parseDate(batch.startDate);
  const end = parseDate(batch.endDate) || start;
  const schedule = parseSchedule(batch.schedule);

  if (explicit) return [explicit];
  if (!start) return [];

  // A one-day batch is a single class even if its weekday text does not match the calendar date.
  if (end && start.getTime() === end.getTime()) return [dateKey(start)];

  const finish = end && end >= start ? end : start;
  const dates = [];
  for (const cursor = new Date(start); cursor <= finish; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    if (!schedule.weekdays.length || schedule.weekdays.includes(cursor.getUTCDay())) {
      dates.push(dateKey(cursor));
    }
    if (dates.length >= 370) break;
  }
  return dates;
}

function toZoomStart(date, startTime) {
  return `${date}T${startTime || '15:15'}:00+05:30`;
}

async function syncBatchSessions(batchId, { createZoom = true } = {}) {
  const Batch = require('../models/Batch');
  const batch = await Batch.findById(batchId).populate('course').populate('teacher');
  if (!batch) throw new Error('Batch not found');

  const course = batch.course || await Course.findById(batch.course);
  if (!course) throw new Error('Course not found');
  const teacher = batch.teacher || await Teacher.findById(batch.teacher);
  const parsed = parseSchedule(batch.schedule);
  const dates = getSessionDates(batch);
  const startTime = parsed.startTime || '15:15';

  const existing = await ClassSession.find({ batch: batch._id }).select('_id date startTime');
  const wantedKeys = new Set(dates.map((date) => `${date}|${startTime}`));
  const staleIds = existing.filter((s) => !wantedKeys.has(`${s.date}|${s.startTime}`)).map((s) => s._id);
  if (staleIds.length) await ClassSession.deleteMany({ _id: { $in: staleIds } });

  const results = [];
  const warnings = [];
  for (const date of dates) {
    const filter = { batch: batch._id, date, startTime };
    let session = await ClassSession.findOne(filter);

    const base = {
      course: course._id,
      batch: batch._id,
      date,
      startTime,
      topic: batch.topic || batch.name,
      mentorName: batch.mentorName || teacher?.name || '',
      cancelled: Boolean(batch.cancelled || batch.status === 'cancelled'),
    };

    if (batch.telegramGroupId) base.telegramGroupId = batch.telegramGroupId;
    if (!batch.telegramGroupId && course.telegramGroupId) {
      batch.telegramGroupId = course.telegramGroupId;
    }

    if (!session) {
      session = new ClassSession(base);
    } else {
      Object.assign(session, base);
    }

    if (!session.zoomJoinUrl && batch.zoomJoinUrl) {
      session.zoomJoinUrl = batch.zoomJoinUrl;
      session.zoomMeetingId = batch.zoomMeetingId || '';
      session.zoomPasscode = batch.zoomPasscode || '';
    }

    if (!session.zoomJoinUrl && createZoom && process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
      try {
        const meeting = await createMeeting({
          topic: base.topic,
          startTime: toZoomStart(date, startTime),
          durationMinutes: process.env.ZOOM_DEFAULT_DURATION_MINUTES || 60,
        });
        if (meeting) {
          session.zoomJoinUrl = meeting.joinUrl;
          session.zoomMeetingId = meeting.meetingId;
          session.zoomPasscode = meeting.passcode;
        }
      } catch (err) {
        warnings.push(`${date}: Zoom meeting could not be created (${err.message})`);
      }
    }

    await session.save();
    results.push(session);
  }

  if (batch.telegramGroupId !== course.telegramGroupId) {
    batch.telegramGroupId = course.telegramGroupId || batch.telegramGroupId;
  }
  await batch.save();

  return { sessions: results, warnings };
}

async function removeBatchSessions(batchId) {
  await ClassSession.deleteMany({ batch: batchId });
}

async function backfillExistingSessions() {
  const Batch = require('../models/Batch');
  const sessions = await ClassSession.find({ $or: [{ batch: { $exists: false } }, { batch: null }] });
  let updated = 0;
  for (const session of sessions) {
    const batch = await Batch.findOne({
      course: session.course,
      $or: [
        { classDate: session.date },
        { startDate: { $lte: new Date(`${session.date}T23:59:59Z`) }, endDate: { $gte: new Date(`${session.date}T00:00:00Z`) } },
      ],
    }).sort({ createdAt: 1 });
    if (!batch) continue;
    await ClassSession.updateOne({ _id: session._id }, { $set: { batch: batch._id } });
    updated++;
  }
  return updated;
}

module.exports = { parseSchedule, getSessionDates, syncBatchSessions, removeBatchSessions, backfillExistingSessions };
