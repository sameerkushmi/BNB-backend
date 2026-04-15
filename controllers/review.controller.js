const Product = require("../models/Product");

// ⭐ Add or Update Review
exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, rating, comment } = req.body;

        if (!productId || !rating) {
            return res.status(400).json({
                message: "Product ID and rating are required",
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // 🔍 check existing review
        const existingReview = product.reviews.find(
            (rev) => rev.user.toString() === userId
        );

        if (existingReview) {
            // ✏️ UPDATE
            existingReview.rating = rating;
            existingReview.comment = comment || existingReview.comment;
        } else {
            // ➕ ADD
            product.reviews.push({
                user: userId,
                name: req.user.name,
                rating,
                comment,
            });
        }

        // ⭐ RECALCULATE
        const totalRatings = product.reviews.length;

        const avg =
            product.reviews.reduce((acc, item) => acc + item.rating, 0) /
            totalRatings;

        product.ratingsAverage = avg.toFixed(1);
        product.ratingsCount = totalRatings;

        await product.save();

        return res.json({
            message: existingReview
                ? "Review updated successfully"
                : "Review added successfully",
            reviews: product.reviews,
            ratingsAverage: product.ratingsAverage,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// 📥 Get all reviews for a product
exports.getReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .select("reviews ratingsAverage ratingsCount")
            .populate("reviews.user", "name");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        return res.json({
            reviews: product.reviews,
            ratingsAverage: product.ratingsAverage,
            ratingsCount: product.ratingsCount,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

// ❌ Delete review
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, reviewId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const review = product.reviews.id(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        // 🔒 only owner or admin
        if (
            review.user.toString() !== userId &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        review.deleteOne();

        // 🔄 recalc ratings
        const total = product.reviews.length;

        const avg =
            total === 0
                ? 0
                : product.reviews.reduce((acc, item) => acc + item.rating, 0) /
                total;

        product.ratingsAverage = avg.toFixed(1);
        product.ratingsCount = total;

        await product.save();

        return res.json({
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};