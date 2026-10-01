exports.list = (Model, populate = "", options = {}) => async (req, res) => {
  const filter = { ...(options.baseFilter || {}) };
  if (req.user.role === "student" && options.studentField) {
    const Student = require("../models/Student");
    const student = await Student.findOne({ user: req.user._id }).select("_id");
    filter[options.studentField] = student ? student._id : null;
  }
  const rows = await Model.find(filter).populate(populate).sort({ createdAt: -1 });
  res.json({ success: true, data: rows });
};

exports.create = (Model) => async (req, res) => {
  const data = { ...req.body };
  if (Model.schema.path("createdBy")) data.createdBy = req.user._id;
  if (Model.schema.path("markedBy")) data.markedBy = req.user._id;
  if (Model.schema.path("gradedBy")) data.gradedBy = req.user._id;
  res.status(201).json({ success: true, data: await Model.create(data) });
};

exports.update = (Model) => async (req, res) => {
  const row = await Model.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!row) return res.status(404).json({ success: false, message: "Record not found" });
  res.json({ success: true, data: row });
};

exports.remove = (Model) => async (req, res) => {
  const row = await Model.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: "Record not found" });
  res.json({ success: true, message: "Deleted" });
};
