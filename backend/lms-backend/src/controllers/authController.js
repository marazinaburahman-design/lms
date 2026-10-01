const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const { nextNumber } = require("../utils/serial");

function token(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || "Student",
    lastName: parts.join(" ") || undefined,
  };
}

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();

  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, message: "Email already exists" });
  }

  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone is required for student registration" });
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    phone,
    role: "student",
  });

  let student;
  try {
    const { firstName, lastName } = splitName(name);
    student = await Student.create({
      registrationNo: await nextNumber(Student, "registrationNo", "STU"),
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      user: user._id,
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  res.status(201).json({
    success: true,
    message: "Student account created successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    student: {
      id: student._id,
      registrationNo: student.registrationNo,
    },
    token: token(user._id),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Account disabled" });
  }
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    token: token(user._id),
  });
};

exports.me = async (req, res) => res.json({ success: true, user: req.user });
