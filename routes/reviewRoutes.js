const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");

const {
    addReview,
    getReviews,
    deleteReview,
} = require("../controllers/review.controller");

// ⭐ add/update
router.post("/", protect, addReview);

// 📥 get
router.get("/:productId", getReviews);

// ❌ delete
router.delete("/:productId/:reviewId", protect, deleteReview);

module.exports = router;