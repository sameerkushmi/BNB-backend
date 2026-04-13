const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require('../models/Product')
// ===============================
// CREATE ORDER
// ===============================
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            items,
            shippingDetails,
            subtotal,
            shippingFee = 0,
            totalAmount,
            paymentMethod = "COD",
        } = req.body;

        // validation
        if (!items || items.length === 0) {
            return res.status(400).json({
                message: "No items found in order",
            });
        }

        // Transform cart items to order items (support multiple client formats)
        const orderItems = items.map((item) => ({
            // Accept `product`, `productId`, `id`, or `_id` from various clients
            productId: item.product || item.productId || item.id || item._id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
        }));

        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingDetails,
            subtotal,
            shippingFee,
            totalAmount,
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
            orderStatus: "PROCESSING",
        });

        // clear cart only if cart exists
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        return res.status(500).json({
            message: "Server error while creating order",
        });
    }
};

// controllers/orderController.js (add below)

exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate("items.productId");

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error("Get Orders Error:", error);
        return res.status(500).json({
            message: "Error fetching orders",
        });
    }
};

// GET /api/orders/admin
exports.getAllOrders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const query = {
            $or: [
                { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
                { "shippingDetails.fullName": { $regex: search, $options: "i" } },
                { "shippingDetails.phone": { $regex: search, $options: "i" } },
            ].filter(Boolean),
        };

        const orders = await Order.find(search ? query : {})
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Order.countDocuments(search ? query : {});

        res.json({
            orders,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("items.productId");

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Get Order Error:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        // ❗ Prevent double stock reduction
        const wasDelivered = order.orderStatus === "DELIVERED";

        order.orderStatus = status;

        if (status === "DELIVERED") {
            order.isPaid = true;
            order.paymentStatus = "PAID";
            order.paidAt = new Date();

            // ✅ Reduce stock only ONCE
            if (!wasDelivered) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                stock: -item.quantity,
                                sold: item.quantity,
                            },
                        }
                    );
                }
            }
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order updated",
            order,
        });
    } catch (error) {
        console.error("Update Order Error:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};