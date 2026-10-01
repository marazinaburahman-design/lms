const express = require('express');
const Batch = require('../models/Batch'); // change to your real model path
const { sendClassLinks, sendForBatch } = require('../jobs/zoomLinkScheduler');
// const { auth, adminOnly } = require('../middleware/auth'); // use your real auth middleware

const router = express.Router();
// router.use(auth, adminOnly);

// Send one batch's link right now
router.post('/test-send/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    await sendForBatch(batch);
    res.json({ ok: true, message: `Sent for ${batch.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run the same job the 3:00 PM cron runs
router.post('/run-now', async (req, res) => {
  try {
    res.json({ ok: true, ...(await sendClassLinks()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;