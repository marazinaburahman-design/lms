const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const { sendTelegram } = require("./telegramService");
const { emitToUser, emitToRole } = require("./socketService");
const Notification = require("../models/Notification");
const { invoiceEmail } = require("../utils/emailTemplates");

async function createApprovalNotification(invoice) {
  const n = await Notification.create({
    type: "invoice_approval",
    title: "Invoice awaiting approval",
    message: `Invoice ${invoice.invoiceNo} is ready for verification.`,
    entityType: "Invoice",
    entityId: invoice._id,
  });
  emitToRole("admin", "notification:new", n);
  emitToRole("staff", "notification:new", n);
  return n;
}

async function notifyStudent(invoice, { email = false, sms = false, telegram = false }) {
  const result = {
    email: { requested: email, sent: false },
    sms: { requested: sms, sent: false },
    telegram: { requested: telegram, sent: false },
    errors: [],
  };
  const s = invoice.student;
  const subject = `Invoice ${invoice.invoiceNo} - LMS`;
  const text =
    `Dear ${s.firstName},\n\n` +
    `Your invoice ${invoice.invoiceNo} has been approved.\n` +
    `Total: ${invoice.currency} ${invoice.total.toFixed(2)}\n` +
    `Paid: ${invoice.currency} ${invoice.paidAmount.toFixed(2)}\n` +
    `Balance: ${invoice.currency} ${invoice.balance.toFixed(2)}\n\nThank you.`;

  if (email) {
    try {
      if (!s.email) throw new Error("Student email is missing");
      const r = await sendEmail({
        to: s.email,
        subject,
        text,
        html: invoiceEmail({ academyName: process.env.EMAIL_FROM_NAME, student: s, invoice }),
        attachments: invoice.pdfPath ? [{ filename: `${invoice.invoiceNo}.pdf`, path: invoice.pdfPath }] : [],
      });
      result.email.sent = !!r.sent;
    } catch (e) { result.errors.push(`Email: ${e.message}`); }
  }

  if (sms) {
    try {
      if (!s.phone) throw new Error("Student phone is missing");
      const r = await sendSMS({
        to: s.phone,
        message: `LMS: Invoice ${invoice.invoiceNo} approved. Total ${invoice.currency} ${invoice.total.toFixed(2)}, Paid ${invoice.currency} ${invoice.paidAmount.toFixed(2)}, Balance ${invoice.currency} ${invoice.balance.toFixed(2)}.`,
      });
      result.sms.sent = !!r.sent;
    } catch (e) { result.errors.push(`SMS: ${e.message}`); }
  }

  if (telegram) {
    try {
      if (!s.telegramChatId && !process.env.TELEGRAM_CHAT_ID) throw new Error("Telegram chat ID is missing");
      const r = await sendTelegram({
        chatId: s.telegramChatId,
        text: `Invoice ${invoice.invoiceNo} approved.\nTotal: ${invoice.currency} ${invoice.total.toFixed(2)}\nPaid: ${invoice.currency} ${invoice.paidAmount.toFixed(2)}\nBalance: ${invoice.currency} ${invoice.balance.toFixed(2)}`,
      });
      result.telegram.sent = !!r.sent;
    } catch (e) { result.errors.push(`Telegram: ${e.message}`); }
  }

  return result;
}

module.exports = { createApprovalNotification, notifyStudent };
