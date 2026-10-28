// Vercel serverless entrypoint for the Express REST API.
require("dotenv").config();
function handleCorsPreflight(req, res) {
  if (req.method !== "OPTIONS") return false;
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (!origin || !allowedOrigins.includes(origin)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: false, message: "Origin not allowed" }));
    return true;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.statusCode = 204;
  res.end();
  return true;
}

const app = require("../src/app");
const connectDB = require("../src/config/db");

module.exports = async (req, res) => {
  if (handleCorsPreflight(req, res)) return;
  const pathname = (req.url || "").split("?")[0];
  if (pathname !== "/api/health") {
    try {
      await connectDB();
    } catch (error) {
      console.error("Database connection failed:", error.message);
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Configure MONGO_URI in Vercel environment variables."
      });
    }
  }
  return app(req, res);
};
