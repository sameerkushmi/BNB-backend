const express = require("express");
const { protect } = require("../middlewares/auth.middleware.js");
const { adminProtect } = require("../middlewares/admin.middleware.js");
const { getMe, getAllUsers, deleteUser, updateUser } = require("../controllers/user.controller.js");

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/get-all", protect, adminProtect, getAllUsers)
router.put("/update/:id", protect, adminProtect, updateUser);
router.delete("/delete/:id", protect, adminProtect, deleteUser);

module.exports = router;