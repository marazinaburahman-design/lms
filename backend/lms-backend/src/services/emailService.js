const nodemailer = require("nodemailer");
function enabled() {
  return String(process.env.EMAIL_ENABLED).toLowerCase() === "true";
}
function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}
async function sendEmail({ to, subject, text, html, attachments = [] }) {
  if (!enabled())
    return {
      sent: false,
      skipped: true,
      message: "Email integration is disabled",
    };
  if (!to) throw new Error("Student email is missing");
  const info = await transporter().sendMail({
    from: `${process.env.EMAIL_FROM_NAME || "LMS"} <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return { sent: true, messageId: info.messageId };
}
async function testEmail(to) {
  return sendEmail({
    to,
    subject: "LMS test email",
    text: "This is a test email from your LMS backend.",
  });
}
module.exports = { sendEmail, testEmail };
