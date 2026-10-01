const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    date: { type: String, required: true },
    startTime: { type: String, default: '15:15' },
    topic: { type: String, required: true, trim: true },
    mentorName: { type: String, trim: true },
    zoomJoinUrl: { type: String, trim: true },
    zoomMeetingId: { type: String, trim: true },
    zoomPasscode: { type: String, trim: true },
    cancelled: { type: Boolean, default: false },
    linkSent: { type: Boolean, default: false },
    sentAt: Date,
  },
  { timestamps: true }
);

sessionSchema.index({ batch: 1, date: 1, startTime: 1 }, { unique: true });
sessionSchema.index({ course: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('ClassSession', sessionSchema);
