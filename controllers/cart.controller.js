const Cart = require("../models/Cart");
const Product = require("../models/Product");

// helper
function calculateCartTotals(cart) {
    let totalItems = 0;
    let totalPrice = 0;

    cart.items.forEach((item) => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;
    });

    cart.totalItems = totalItems;
    cart.totalPrice = totalPrice;
}

/**
 * 🟢 Get Cart
 */
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        let cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        // remove null products (deleted products safety)
        cart.items = cart.items.filter((item) => item.product);

        await cart.save();

        res.json({
            success: true,
            data: cart,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🟢 Add to Cart
 */
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const existingItem = cart.items.find(
            (item) =>
                item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product: product._id,
                name: product.name,
                image: product.images?.[0].url || "",
                price: product.price,
                quantity,
            });
        }

        calculateCartTotals(cart);
        await cart.save();

        res.json({
            success: true,
            message: "Item added to cart",
            data: cart,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🟡 Update Cart Item
 */
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.find(
            (i) =>
                i.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        // remove if qty <= 0
        if (quantity <= 0) {
            cart.items = cart.items.filter(
                (i) =>
                    !(
                        i.product.toString() === productId
                    )
            );
        } else {
            item.quantity = quantity;
        }

        calculateCartTotals(cart);
        await cart.save();

        res.json({
            success: true,
            message: "Cart updated",
            data: cart,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🔴 Remove Item
 */
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(
            (item) =>
                !(
                    item.product.toString() === productId
                )
        );

        calculateCartTotals(cart);
        await cart.save();

        res.json({
            success: true,
            message: "Item removed",
            data: cart,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🔵 Clear Cart
 */
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = [];

        calculateCartTotals(cart);
        await cart.save();

        res.json({
            success: true,
            message: "Cart cleared",
            data: cart,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};