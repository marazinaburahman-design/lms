// Explicit Vercel function for the dashboard summary endpoint.
// Keep preflight handling ahead of database connection and Express middleware.
require("dotenv").config();

const app = require("../../src/app");
const connectDB = require("../../src/config/db");

const productionClientOrigin = "https://lms-frontend-abdur-rahman7.vercel.app";
const allowedOrigins = [
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean),
  productionClientOrigin,
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) return false;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] || "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  return true;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const corsAllowed = setCors(req, res);

  if (req.method === "OPTIONS") {
    if (!corsAllowed) {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Origin not allowed" }));
    }
    res.statusCode = 204;
    return res.end();
  }

  if (origin && !corsAllowed) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ success: false, message: "Origin not allowed" }));
  }

  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({
      success: false,
      message: "Database unavailable. Configure MONGO_URI in Vercel environment variables."
    }));
  }

  // Reuse the existing Express route and its authentication/authorization.
  return app(req, res);
};
