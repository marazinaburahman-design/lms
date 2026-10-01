const Enrollment = require("../models/Enrollment");
const { joinCourseGroup } = require("../services/telegramGroupService");
const { sendEmail } = require("../services/emailService");
const { sendTelegram } = require("../services/telegramService");
const Student = require("../models/Student");
const Batch = require("../models/Batch");

exports.list = async (req, res) => {
  const filter = {};
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }).select("_id");
    if (!student) return res.json({ success: true, enrollments: [] });
    filter.student = student._id;
  }
  res.json({
    success: true,
    enrollments: await Enrollment.find(filter).populate("student course batch").sort({ createdAt: -1 }),
  });
};

exports.get = async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id).populate("student course batch");
  if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }).select("_id");
    if (!student || String(enrollment.student?._id) !== String(student._id)) {
      return res.status(403).json({ success: false, message: "You can only view your own enrollments" });
    }
  }
  res.json({ success: true, enrollment });
};

exports.create = async (req, res) => {
  const enrollment = await Enrollment.create(req.body);
  const full = await Enrollment.findById(enrollment._id).populate("student course batch");
  const telegram = await joinCourseGroup(full.course._id, full.student);

  if (telegram.groupId) {
    await Batch.updateMany({ course: full.course._id }, { $set: { telegramGroupId: telegram.groupId } });
  }

  if (telegram.status === "invite_link") {
    const s = full.student;
    const text = `Welcome to ${full.course.name}! Join your course group here: ${telegram.link}`;
    try {
      if (s.telegramChatId) await sendTelegram({ chatId: s.telegramChatId, text });
      else if (s.email) await sendEmail({ to: s.email, subject: `Join your ${full.course.name} group`, text });
    } catch (e) {
      console.error("Invite link delivery failed:", e.message);
    }
  }

  res.status(201).json({ success: true, enrollment: full, telegram });
};

exports.update = async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  ).populate("student course batch");
  if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });
  res.json({ success: true, enrollment });
};

exports.remove = async (req, res) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });
  res.json({ success: true, message: "Enrollment deleted" });
};
