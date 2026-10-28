// Explicit nested auth route for Vercel. The shared Express app still owns
// authentication routing, CORS policy, validation, and error handling.
require("dotenv").config();
const app = require("../../src/app");
const connectDB = require("../../src/config/db");

module.exports = async (req, res) => {
  const pathname = (req.url || "").split("?")[0];
  if (req.method !== "OPTIONS" && pathname !== "/api/health") {
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
