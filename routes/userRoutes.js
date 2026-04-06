const express = require("express");
const { protect } = require("../middlewares/auth.middleware.js");
const { getMe } = require("../controllers/user.controller.js");

const router = express.Router();

// GET /api/users/me - return currently authenticated user
router.get("/me", protect, getMe);

module.exports = router;