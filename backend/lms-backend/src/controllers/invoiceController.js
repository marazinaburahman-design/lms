const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const { nextNumber } = require("../utils/serial");
const { generateInvoicePdf } = require("../services/invoicePdfService");
const { createApprovalNotification, notifyStudent } = require("../services/invoiceNotificationService");
const fs = require("fs");

function calculate(body) {
  const items = (body.items || []).map((i) => ({
    description: i.description,
    quantity: Number(i.quantity || 1),
    unitPrice: Number(i.unitPrice || 0),
    amount: Number(i.amount ?? Number(i.quantity || 1) * Number(i.unitPrice || 0)),
  }));
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discount = Number(body.discount || 0);
  const tax = Number(body.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);
  const paid = Number(body.paidAmount || 0);
  if (paid > total) throw Object.assign(new Error("Paid amount cannot exceed invoice total"), { status: 400 });
  return { items, subtotal, discount, tax, total, paidAmount: paid, balance: Math.max(0, total - paid) };
}

async function getStudentForUser(userId) {
  return Student.findOne({ user: userId }).select("_id");
}

function canAccessInvoice(req, invoice) {
  return req.user.role !== "student" || String(invoice.student?._id || invoice.student) === String(req.user.studentId);
}

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === "student") {
    const student = await getStudentForUser(req.user._id);
    filter.student = student ? student._id : null;
  } else if (req.query.student) filter.student = req.query.student;
  res.json({
    success: true,
    invoices: await Invoice.find(filter).populate("student").populate("enrollment").populate("createdBy", "name email").populate("verifiedBy", "name email").sort({ createdAt: -1 }),
  });
};

exports.get = async (req, res) => {
  const i = await Invoice.findById(req.params.id).populate("student").populate("enrollment").populate("createdBy", "name email").populate("verifiedBy", "name email");
  if (!i) return res.status(404).json({ success: false, message: "Invoice not found" });
  if (req.user.role === "student") {
    const student = await getStudentForUser(req.user._id);
    if (!student || String(i.student._id) !== String(student._id)) return res.status(403).json({ success: false, message: "You can only view your own invoices" });
  }
  res.json({ success: true, invoice: i });
};

exports.create = async (req, res) => {
  const student = await Student.findById(req.body.student);
  if (!student) return res.status(404).json({ success: false, message: "Student not found" });
  const calc = calculate(req.body);
  const invoice = await Invoice.create({
    ...calc,
    invoiceNo: await nextNumber(Invoice, "invoiceNo", "INV"),
    student: student._id,
    enrollment: req.body.enrollment,
    paymentMethod: req.body.paymentMethod,
    paymentReference: req.body.paymentReference,
    receiptUrl: req.body.receiptUrl,
    notes: req.body.notes,
    dueDate: req.body.dueDate,
    currency: req.body.currency || "LKR",
    createdBy: req.user._id,
    status: "pending_approval",
  });
  const populated = await Invoice.findById(invoice._id).populate("student").populate("createdBy", "name email");
  await createApprovalNotification(populated);
  res.status(201).json({ success: true, message: "Invoice created and sent for approval", invoice: populated });
};

exports.update = async (req, res) => {
  const i = await Invoice.findById(req.params.id);
  if (!i) return res.status(404).json({ success: false, message: "Invoice not found" });
  if (["approved", "paid", "partially_paid"].includes(i.status)) return res.status(400).json({ success: false, message: "Approved invoice cannot be edited directly" });
  const editable = ["items", "discount", "tax", "paidAmount", "enrollment", "paymentMethod", "paymentReference", "receiptUrl", "notes", "dueDate", "currency"];
  const body = { ...i.toObject() };
  for (const key of editable) if (key in req.body) body[key] = req.body[key];
  Object.assign(i, calculate(body));
  for (const key of editable) if (key in req.body && !["items", "discount", "tax", "paidAmount"].includes(key)) i[key] = req.body[key];
  await i.save();
  res.json({ success: true, invoice: i });
};

exports.reject = async (req, res) => {
  const i = await Invoice.findById(req.params.id).populate({ path: "student", populate: { path: "user", select: "_id" } });
  if (!i) return res.status(404).json({ success: false, message: "Invoice not found" });
  if (i.status !== "pending_approval") return res.status(400).json({ success: false, message: `Invoice is already ${i.status}` });
  i.status = "rejected";
  i.rejectionReason = req.body.reason || "Rejected during verification";
  i.verifiedBy = req.user._id;
  i.verifiedAt = new Date();
  await i.save();
  const Notification = require("../models/Notification");
  const studentUser = i.student?.user;
  const n = await Notification.create({ recipient: studentUser, student: i.student._id, type: "invoice_rejected", title: "Invoice rejected", message: `Invoice ${i.invoiceNo} was rejected.`, entityType: "Invoice", entityId: i._id });
  if (studentUser) require("../services/socketService").emitToUser(studentUser, "notification:new", n);
  res.json({ success: true, message: "Invoice rejected", invoice: i, notification: n });
};

exports.approve = async (req, res) => {
  const i = await Invoice.findById(req.params.id).populate({ path: "student", populate: { path: "user", select: "_id" } });
  if (!i) return res.status(404).json({ success: false, message: "Invoice not found" });
  if (i.status !== "pending_approval") return res.status(400).json({ success: false, message: `Invoice is already ${i.status}` });
  const email = !!req.body.email, sms = !!req.body.sms, telegram = !!req.body.telegram;
  if (!email && !sms && !telegram) return res.status(400).json({ success: false, message: "Select at least Email, SMS or Telegram" });

  const pdf = await generateInvoicePdf(i);
  i.pdfPath = pdf;
  i.status = i.balance <= 0 ? "paid" : "partially_paid";
  i.approvedAt = new Date();
  i.verifiedAt = new Date();
  i.verifiedBy = req.user._id;
  i.notification.email = email;
  i.notification.sms = sms;
  i.notification.telegram = telegram;
  await i.save();

  const result = await notifyStudent(i, { email, sms, telegram });
  i.notification.emailSent = result.email.sent;
  i.notification.smsSent = result.sms.sent;
  i.notification.telegramSent = result.telegram.sent;
  i.notification.emailSentAt = result.email.sent ? new Date() : undefined;
  i.notification.smsSentAt = result.sms.sent ? new Date() : undefined;
  i.notification.telegramSentAt = result.telegram.sent ? new Date() : undefined;
  if (result.errors.length) i.notification.errors.push(...result.errors);
  await i.save();

  const Notification = require("../models/Notification");
  const studentUser = i.student?.user;
  const n = await Notification.create({ recipient: studentUser, student: i.student._id, type: "invoice_approved", title: "Invoice approved", message: `Invoice ${i.invoiceNo} has been approved.`, entityType: "Invoice", entityId: i._id });
  if (studentUser) require("../services/socketService").emitToUser(studentUser, "notification:new", n);
  res.json({ success: true, message: "Invoice approved and notification process completed", invoice: i, delivery: result, notification: n });
};

exports.preview = async (req, res) => {
  const i = await Invoice.findById(req.params.id).populate("student").populate("enrollment");
  if (!i) return res.status(404).json({ success: false, message: "Invoice not found" });
  if (req.user.role === "student") {
    const student = await getStudentForUser(req.user._id);
    if (!student || String(i.student._id) !== String(student._id)) return res.status(403).json({ success: false, message: "You can only view your own invoices" });
  }
  res.json({ success: true, preview: { invoiceNo: i.invoiceNo, student: i.student, items: i.items, subtotal: i.subtotal, discount: i.discount, tax: i.tax, total: i.total, paidAmount: i.paidAmount, balance: i.balance, currency: i.currency, paymentMethod: i.paymentMethod, paymentReference: i.paymentReference, dueDate: i.dueDate, status: i.status } });
};

exports.pdf = async (req, res) => {
  const i = await Invoice.findById(req.params.id);
  if (!i) return res.status(404).json({ success: false, message: "Invoice not found" });
  if (!i.pdfPath || !fs.existsSync(i.pdfPath)) return res.status(404).json({ success: false, message: "Invoice PDF not found" });
  if (req.user.role === "student") {
    const student = await getStudentForUser(req.user._id);
    if (!student || String(i.student) !== String(student._id)) return res.status(403).json({ success: false, message: "You can only access your own invoice" });
  }
  res.type("application/pdf");
  res.sendFile(require("path").resolve(i.pdfPath));
};
