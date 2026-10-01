const Student = require("../models/Student");
const Course = require("../models/Course");
const Invoice = require("../models/Invoice");
const Enrollment = require("../models/Enrollment");
const Notification = require("../models/Notification");

exports.summary = async (req, res) => {
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }).select("_id");
    if (!student) {
      return res.json({ success: true, summary: { students: 0, courses: 0, enrollments: 0, pendingInvoices: 0, approvedInvoices: 0, unreadApprovals: 0 } });
    }
    const [enrollments, pendingInvoices, approvedInvoices, unreadNotifications] = await Promise.all([
      Enrollment.countDocuments({ student: student._id, status: "active" }),
      Invoice.countDocuments({ student: student._id, status: "pending_approval" }),
      Invoice.countDocuments({ student: student._id, status: { $in: ["approved", "paid", "partially_paid"] } }),
      Notification.countDocuments({ $or: [{ recipient: req.user._id }, { student: student._id }], read: false }),
    ]);
    return res.json({ success: true, summary: { students: 1, courses: 0, enrollments, pendingInvoices, approvedInvoices, unreadApprovals: unreadNotifications } });
  }

  const [students, courses, enrollments, pendingInvoices, approvedInvoices, unreadApprovals] = await Promise.all([
    Student.countDocuments(),
    Course.countDocuments({ status: "active" }),
    Enrollment.countDocuments({ status: "active" }),
    Invoice.countDocuments({ status: "pending_approval" }),
    Invoice.countDocuments({ status: { $in: ["approved", "paid", "partially_paid"] } }),
    Notification.countDocuments({ read: false, type: "invoice_approval" }),
  ]);
  res.json({ success: true, summary: { students, courses, enrollments, pendingInvoices, approvedInvoices, unreadApprovals } });
};
