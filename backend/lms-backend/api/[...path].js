// Vercel serverless entrypoint for the Express REST API.
// Persistent Socket.IO and background schedulers are intentionally not started here.
require("dotenv").config();
const app = require("../src/app");
const connectDB = require("../src/config/db");

module.exports = async (req, res) => {
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
