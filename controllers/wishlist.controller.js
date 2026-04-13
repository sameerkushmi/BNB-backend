// controllers/wishlist.controller.js
const Wishlist = require("../models/Wishlist");

// ➕ Add to Wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const exists = await Wishlist.findOne({
            user: userId,
            product: productId,
        });

        if (exists) {
            return res.status(400).json({
                message: "Product already in wishlist",
            });
        }

        const wishlist = await Wishlist.create({
            user: userId,
            product: productId,
        });

        return res.status(201).json({
            message: "Added to wishlist",
            wishlist,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// 📥 Get Wishlist
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const wishlist = await Wishlist.find({ user: userId })
            .populate("product")
            .sort({ createdAt: -1 });

        return res.json({
            message: "Wishlist fetched successfully",
            count: wishlist.length,
            wishlist,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ❌ Remove from Wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const deleted = await Wishlist.findOneAndDelete({
            user: userId,
            product: productId,
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Item not found in wishlist",
            });
        }

        return res.json({
            message: "Removed from wishlist",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};