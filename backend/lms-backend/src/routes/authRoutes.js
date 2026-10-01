const r = require("express").Router();
const { body } = require("express-validator");
const v = require("../middleware/validationMiddleware");
const c = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

r.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
  ],
  v,
  c.register,
);
r.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  v,
  c.login,
);
r.get("/me", protect, c.me);

module.exports = r;
