require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/services/socketService');
const { startTelegramBot } = require('./src/services/telegramBotService');
const { startZoomLinkScheduler } = require('./src/jobs/zoomLinkScheduler');
const ClassSession = require('./src/models/ClassSession');
const { backfillExistingSessions } = require('./src/services/classSessionService');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  try { await ClassSession.syncIndexes(); } catch (err) { console.error('ClassSession index sync failed:', err.message); }
  try { const count = await backfillExistingSessions(); if (count) console.log(`Backfilled ${count} existing class session(s).`); } catch (err) { console.error('ClassSession backfill failed:', err.message); }
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`LMS API running on http://localhost:${PORT}`);
    startTelegramBot();
    startZoomLinkScheduler();
  });
})();