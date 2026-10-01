require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Student = require("../src/models/Student");
const Teacher = require("../src/models/Teacher");
const Course = require("../src/models/Course");
const Batch = require("../src/models/Batch");
const Enrollment = require("../src/models/Enrollment");
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Course.deleteMany({}),
    Batch.deleteMany({}),
    Enrollment.deleteMany({}),
  ]);
  const admin = await User.create({
    name: "System Admin",
    email: "admin@lms.local",
    password: "Admin@123",
    phone: "0770000000",
    role: "admin",
  });
  const staff = await User.create({
    name: "Finance Staff",
    email: "staff@lms.local",
    password: "Staff@123",
    phone: "0770000001",
    role: "staff",
  });
  const teacherUser = await User.create({
    name: "Demo Teacher",
    email: "teacher@lms.local",
    password: "Teacher@123",
    role: "teacher",
  });
  const studentUser = await User.create({
    name: "Demo Student",
    email: "student@lms.local",
    password: "Student@123",
    phone: "0771234567",
    role: "student",
  });
  const student = await Student.create({
    registrationNo: "STU-2026-0001",
    firstName: "Demo",
    lastName: "Student",
    email: "student@lms.local",
    phone: "0771234567",
    nic: "200012345678",
    user: studentUser._id,
  });
  const teacher = await Teacher.create({
    employeeNo: "EMP-001",
    name: "Demo Teacher",
    email: "teacher@lms.local",
    phone: "0771111111",
    specialization: "Software Engineering",
    user: teacherUser._id,
  });
  const course = await Course.create({
    code: "WEB-101",
    name: "Full Stack Web Development",
    description: "Demo LMS course",
    duration: "6 months",
    fee: 150000,
    teachers: [teacher._id],
  });
  const batch = await Batch.create({
    name: "October 2026 Batch",
    code: "WEB-101-OCT26",
    course: course._id,
    teacher: teacher._id,
    startDate: new Date("2026-10-05"),
    capacity: 30,
    status: "upcoming",
  });
  const enrollment = await Enrollment.create({
    student: student._id,
    course: course._id,
    batch: batch._id,
    agreedFee: 150000,
    discount: 10000,
    status: "active",
  });
  console.log(
    JSON.stringify(
      {
        admin: { email: "admin@lms.local", password: "Admin@123" },
        staff: { email: "staff@lms.local", password: "Staff@123" },
        student: { email: "student@lms.local", password: "Student@123" },
        ids: {
          student: student._id,
          course: course._id,
          batch: batch._id,
          enrollment: enrollment._id,
        },
      },
      null,
      2,
    ),
  );
  await mongoose.disconnect();
})();
