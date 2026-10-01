const mongoose = require("mongoose");

const digitsOnly = (v) => (v ? String(v).replace(/\D/g, "") : v);

const schema = new mongoose.Schema(
  {
    registrationNo: { type: String, unique: true, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true, required: true },
    alternatePhone: String,
    telegramNumber: { type: String, trim: true, set: digitsOnly }, // number the student uses on Telegram
    telegramChatId: { type: String, trim: true }, // filled automatically by the bot
    nic: { type: String, trim: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    address: String,
    city: String,
    country: { type: String, default: "Sri Lanka" },
    guardianName: String,
    guardianPhone: String,
    status: {
      type: String,
      enum: ["active", "inactive", "completed", "dropped"],
      default: "active",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Student", schema);