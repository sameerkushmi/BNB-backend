const express = require("express");
const router = express.Router();

const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require("../controllers/cart.controller");

const { protect } = require("../middlewares/auth.middleware"); // your JWT middleware

// 🟢 Get user cart
router.get("/", protect, getCart);

// 🟢 Add item to cart
router.post("/add", protect, addToCart);

// 🟡 Update item quantity
router.put("/update", protect, updateCartItem);

// 🔴 Remove item from cart
router.delete("/remove", protect, removeFromCart);

// 🔵 Clear cart
router.delete("/clear", protect, clearCart);

module.exports = router;