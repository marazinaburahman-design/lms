const express = require('express');
const ClassSession = require('../models/ClassSession');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { sendSession, sendDueSessions } = require('../jobs/zoomLinkScheduler');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.post('/', authorize('admin', 'staff', 'teacher'), async (req, res) => {
  try {
    const session = await ClassSession.create(req.body);
    const full = await ClassSession.findById(session._id).populate('course', 'name code telegramGroupId').populate('batch', 'name telegramGroupId');
    res.status(201).json({ success: true, session: full });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const q = {};
    if (req.query.date) q.date = req.query.date;
    if (req.query.course) q.course = req.query.course;
    if (req.query.batch) q.batch = req.query.batch;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id }).select('_id');
      if (!student) return res.json({ success: true, sessions: [] });
      const enrollments = await Enrollment.find({ student: student._id, status: { $ne: 'cancelled' } }).select('course batch');
      const batchIds = enrollments.filter((e) => e.batch).map((e) => e.batch);
      const courseIds = enrollments.map((e) => e.course);
      q.$or = [{ batch: { $in: batchIds } }, { course: { $in: courseIds } }];
    }

    const sessions = await ClassSession.find(q)
      .populate('course', 'name code telegramGroupId')
      .populate('batch', 'name code telegramGroupId')
      .sort({ date: 1, startTime: 1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id', authorize('admin', 'staff', 'teacher'), async (req, res) => {
  try {
    const session = await ClassSession.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('course', 'name code telegramGroupId')
      .populate('batch', 'name code telegramGroupId');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authorize('admin', 'staff'), async (req, res) => {
  const session = await ClassSession.findByIdAndDelete(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  res.json({ success: true, message: 'Class session deleted' });
});

router.post('/:id/send-now', authorize('admin', 'staff', 'teacher'), async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.id)
      .populate('course', 'name code telegramGroupId')
      .populate('batch', 'name code telegramGroupId');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    await sendSession(session);
    await ClassSession.updateOne({ _id: session._id }, { $set: { linkSent: true, sentAt: new Date() } });
    res.json({ success: true, message: 'Class link sent to Telegram' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/run-due', authorize('admin', 'staff'), async (req, res) => {
  try {
    res.json({ success: true, ...(await sendDueSessions()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
