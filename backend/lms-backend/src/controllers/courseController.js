const Course = require("../models/Course");
exports.list = async (req, res) =>
  res.json({
    success: true,
    courses: await Course.find().populate("teachers").sort({ createdAt: -1 }),
  });
exports.get = async (req, res) =>
  res.json({
    success: true,
    course: await Course.findById(req.params.id).populate("teachers"),
  });
exports.create = async (req, res) =>
  res
    .status(201)
    .json({ success: true, course: await Course.create(req.body) });
exports.update = async (req, res) =>
  res.json({
    success: true,
    course: await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ),
  });
exports.remove = async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Course deleted" });
};
