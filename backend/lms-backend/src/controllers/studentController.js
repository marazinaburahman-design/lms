const Student = require("../models/Student");

function isSelf(req, student) {
  return req.user.role === "student" && String(student.user?._id || student.user) === String(req.user._id);
}

exports.list = async (req, res) => {
  const q = req.query.q;
  const filter = q
    ? {
        $or: [
          { registrationNo: new RegExp(q, "i") },
          { firstName: new RegExp(q, "i") },
          { lastName: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
          { phone: new RegExp(q, "i") },
          { nic: new RegExp(q, "i") },
        ],
      }
    : {};

  if (req.user.role === "student") filter.user = req.user._id;

  res.json({
    success: true,
    students: await Student.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 }),
  });
};

exports.get = async (req, res) => {
  const s = await Student.findById(req.params.id).populate("user", "name email role");
  if (!s) return res.status(404).json({ success: false, message: "Student not found" });
  if (req.user.role === "student" && !isSelf(req, s)) {
    return res.status(403).json({ success: false, message: "You can only view your own profile" });
  }
  res.json({ success: true, student: s });
};

exports.create = async (req, res) => {
  const s = await Student.create(req.body);
  res.status(201).json({ success: true, student: s });
};

exports.update = async (req, res) => {
  const s = await Student.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!s) return res.status(404).json({ success: false, message: "Student not found" });
  res.json({ success: true, student: s });
};

exports.remove = async (req, res) => {
  const s = await Student.findByIdAndDelete(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: "Student not found" });
  res.json({ success: true, message: "Student deleted" });
};
