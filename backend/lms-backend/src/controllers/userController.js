const User = require("../models/User");

exports.list = async (req, res) =>
  res.json({ success: true, users: await User.find().select("-password").sort({ createdAt: -1 }) });

exports.get = async (req, res) => {
  const u = await User.findById(req.params.id).select("-password");
  if (!u) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, user: u });
};

exports.update = async (req, res) => {
  const u = await User.findById(req.params.id).select("+password");
  if (!u) return res.status(404).json({ success: false, message: "User not found" });

  const allowed = ["name", "email", "phone", "role", "isActive"];
  for (const key of allowed) if (key in req.body) u[key] = req.body[key];
  if (req.body.password) u.password = req.body.password;
  await u.save();

  const safe = await User.findById(u._id).select("-password");
  res.json({ success: true, user: safe });
};
