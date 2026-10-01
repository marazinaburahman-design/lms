const Notification = require("../models/Notification");

function ownFilter(req) {
  if (req.user.role === "student") return { $or: [{ recipient: req.user._id }, { student: { $in: [] } }] };
  return { $or: [{ recipient: req.user._id }, { type: "invoice_approval" }] };
}

exports.list = async (req, res) => {
  const filter = ownFilter(req);
  if (req.user.role === "student") {
    const Student = require("../models/Student");
    const student = await Student.findOne({ user: req.user._id }).select("_id");
    filter.$or = [{ recipient: req.user._id }];
    if (student) filter.$or.push({ student: student._id });
  }
  if (req.query.unread === "true") filter.read = false;
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
  const notifications = await Notification.find(filter)
    .populate("student", "registrationNo firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(limit);
  const unreadCount = await Notification.countDocuments({ ...filter, read: false });
  res.json({ success: true, notifications, unreadCount });
};

exports.markRead = async (req, res) => {
  const filter = { _id: req.params.id, ...ownFilter(req) };
  const n = await Notification.findOneAndUpdate(
    filter,
    { read: true, readAt: new Date() },
    { new: true },
  );
  if (!n) return res.status(404).json({ success: false, message: "Notification not found" });
  res.json({ success: true, notification: n });
};

exports.markAll = async (req, res) => {
  const result = await Notification.updateMany(
    { ...ownFilter(req), read: false },
    { read: true, readAt: new Date() },
  );
  res.json({ success: true, message: "Notifications marked as read", count: result.modifiedCount });
};
