const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Vercel sits behind a trusted proxy. This is needed for accurate client IP
// handling by express-rate-limit.
app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";
const productionClientOrigin = "https://lms-frontend-abdur-rahman7.vercel.app";
const allowedOrigins = [
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
  productionClientOrigin,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (!isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
// Explicitly terminate preflight requests before rate limiting or DB-backed routes.
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false }));
app.use("/uploads", express.static(require("path").resolve(process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/lms-uploads" : "./uploads"))));

app.get("/api/health", (req, res) => res.json({ success: true, message: "LMS API is healthy", time: new Date().toISOString() }));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/batches", require("./routes/batchRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/grades", require("./routes/gradeRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/class-sessions", require("./routes/classSessionRoutes"));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
