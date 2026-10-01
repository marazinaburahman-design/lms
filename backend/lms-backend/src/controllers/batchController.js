const Batch = require('../models/Batch');
const { syncBatchSessions, removeBatchSessions } = require('../services/classSessionService');

exports.list = async (req, res) => {
  const batches = await Batch.find().populate('course').populate('teacher').sort({ startDate: 1 });
  res.json({ success: true, batches });
};

exports.get = async (req, res) => {
  const batch = await Batch.findById(req.params.id).populate('course teacher');
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  res.json({ success: true, batch });
};

exports.create = async (req, res) => {
  const batch = await Batch.create(req.body);
  let sync = { sessions: [], warnings: [] };
  try { sync = await syncBatchSessions(batch._id); }
  catch (err) { return res.status(400).json({ success: false, message: `Batch created but session setup failed: ${err.message}` }); }
  const full = await Batch.findById(batch._id).populate('course teacher');
  res.status(201).json({ success: true, batch: full, sessions: sync.sessions, warnings: sync.warnings });
};

exports.update = async (req, res) => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  try {
    const sync = await syncBatchSessions(batch._id);
    const full = await Batch.findById(batch._id).populate('course teacher');
    res.json({ success: true, batch: full, sessions: sync.sessions, warnings: sync.warnings });
  } catch (err) {
    res.status(400).json({ success: false, message: `Batch updated but session sync failed: ${err.message}` });
  }
};

exports.remove = async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  await removeBatchSessions(batch._id);
  await batch.deleteOne();
  res.json({ success: true, message: 'Batch and its class sessions deleted' });
};
