const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Batch',
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      code: { type: String, unique: true, required: true },
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
      startDate: Date,
      endDate: Date,
      schedule: String,
      room: String,
      capacity: { type: Number, default: 30 },
      status: {
        type: String,
        enum: ['upcoming', 'active', 'completed', 'cancelled'],
        default: 'upcoming',
      },

      // Zoom link automation
      topic: { type: String, trim: true },
      mentorName: { type: String, trim: true },
      telegramGroupId: { type: String, trim: true },
      zoomJoinUrl: { type: String, trim: true },
      zoomMeetingId: { type: String, trim: true },
      zoomPasscode: { type: String, trim: true },
      classDate: { type: String }, // YYYY-MM-DD
      cancelled: { type: Boolean, default: false },
      linkSent: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);