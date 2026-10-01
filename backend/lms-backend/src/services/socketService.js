const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
      if (!authToken) return next(new Error("Authentication required"));
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user || !user.isActive) return next(new Error("User is not active"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);
    socket.join(`role:${socket.user.role}`);
  });
  return io;
}

function emitToUser(userId, event, payload) { if (io && userId) io.to(`user:${userId}`).emit(event, payload); }
function emitToRole(role, event, payload) { if (io && role) io.to(`role:${role}`).emit(event, payload); }
module.exports = { initSocket, emitToUser, emitToRole };
