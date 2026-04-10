// routes/orderRoutes.js

const express = require("express");
const router = express.Router();

const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
} = require("../controllers/orderController");

const { protect } = require("../middlewares/auth.middleware");
const { adminProtect } = require("../middlewares/admin.middleware");

// ================= USER ROUTES =================
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

// ================= ADMIN ROUTES =================
router.put("/:id/status", protect, adminProtect, updateOrderStatus);

module.exports = router;