const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Course',
  new mongoose.Schema(
    {
      code: { type: String, unique: true, required: true, trim: true },
      name: { type: String, required: true },
      description: String,
      duration: String,
      fee: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'LKR' },
      status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
      teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
      telegramGroupId: { type: String },        // one shared group per course
      telegramGroupCreating: { type: Boolean }, // temporary lock while the group is being created
    },
    { timestamps: true }
  )
);