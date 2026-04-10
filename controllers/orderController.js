// controllers/orderController.js

const Order = require("../models/Order");
const Cart = require("../models/Cart");

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

        // Transform cart items to order items (product -> productId)
        const orderItems = items.map(item => ({
            productId: item.product || item.productId, // handle both formats
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
            orderStatus: "PENDING",
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

        order.orderStatus = status;

        if (status === "DELIVERED") {
            order.isPaid = true;
            order.paymentStatus = "PAID";
            order.paidAt = new Date();
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