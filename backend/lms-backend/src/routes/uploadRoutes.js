const r = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/uploadController');

// Vercel's deployment filesystem is read-only; /tmp is writable but ephemeral.
// Use durable object storage for uploads that must persist across invocations.
const defaultUploadDir = process.env.VERCEL ? '/tmp/lms-uploads' : './uploads';
const dir = path.resolve(process.env.UPLOAD_DIR || defaultUploadDir);
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 }
});

r.post('/', protect, authorize('admin', 'staff'), upload.single('file'), c.upload);

module.exports = r;
