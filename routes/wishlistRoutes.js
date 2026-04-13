// routes/wishlist.routes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
} = require("../controllers/wishlist.controller");

// ➕ Add
router.post("/", protect, addToWishlist);

// 📥 Get all
router.get("/", protect, getWishlist);

// ❌ Remove
router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;