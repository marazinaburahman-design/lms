// Vercel serverless entrypoint for the Express REST API.
// Persistent Socket.IO and background schedulers are not started in this function.
require("dotenv").config();
const app = require("../src/app");
module.exports = app;
