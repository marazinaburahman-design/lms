// Explicit Vercel function route prevents platform-level redirects on auth preflight requests.
require("dotenv").config();
const app = require("../../src/app");
const connectDB = require("../../src/config/db");

module.exports = async (req, res) => {
  if (req.method !== "OPTIONS") {
    try {
      await connectDB();
    } catch (error) {
      console.error("Database connection failed:", error.message);
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Check the MONGO_URI environment variable."
      });
    }
  }
  return app(req, res);
};
