const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { adminProtect } = require('../middlewares/admin.middleware');
const { updateProfile, changePassword } = require("../controllers/admin.controller");

// Profile
router.put("/profile", protect, adminProtect, updateProfile);

// Password
router.put("/change-password", protect, adminProtect, changePassword);

module.exports = router;