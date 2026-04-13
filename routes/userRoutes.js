const express = require("express");
const { protect } = require("../middlewares/auth.middleware.js");
const { adminProtect } = require("../middlewares/admin.middleware.js");
const { getMe, getAllUsers, deleteUser, updateUser, getUserById, updateProfile } = require("../controllers/user.controller.js");
const upload = require('../middlewares/upload.js')

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/get-all", protect, adminProtect, getAllUsers)
router.get('/get-by-id/:id', protect, adminProtect, getUserById)
router.put("/update/:id", protect, adminProtect, updateUser);
router.put("/update-profile", protect, upload.single("avatar"), updateProfile);
router.delete("/delete/:id", protect, adminProtect, deleteUser);

module.exports = router;