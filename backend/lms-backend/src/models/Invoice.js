const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

module.exports = mongoose.model(
  "Invoice",
  new mongoose.Schema(
    {
      invoiceNo: { type: String, unique: true, index: true },
      student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
      enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
      items: [itemSchema],
      subtotal: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      paidAmount: { type: Number, default: 0, min: 0 },
      balance: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: "LKR" },
      paymentMethod: { type: String, enum: ["cash", "bank_transfer", "card", "online", "cheque", "other"], default: "cash" },
      paymentReference: String,
      receiptUrl: String,
      notes: String,
      dueDate: Date,
      status: { type: String, enum: ["pending_approval", "approved", "rejected", "cancelled", "paid", "partially_paid"], default: "pending_approval" },
      rejectionReason: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verifiedAt: Date,
      approvedAt: Date,
      notification: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false },
        emailSent: { type: Boolean, default: false },
        smsSent: { type: Boolean, default: false },
        telegramSent: { type: Boolean, default: false },
        emailSentAt: Date,
        smsSentAt: Date,
        telegramSentAt: Date,
        errors: [String],
      },
      pdfPath: String,
    },
    { timestamps: true },
  ),
);
