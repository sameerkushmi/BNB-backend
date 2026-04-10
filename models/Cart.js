const mongoose = require("mongoose");

// Each product inside cart
const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },
    },
    { _id: false }
);

// Main cart schema
const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        items: [cartItemSchema],

        totalItems: {
            type: Number,
            default: 0,
        },

        totalPrice: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// 🔥 reusable calculator
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

// ensure totals always correct
cartSchema.pre("save", function () {
    calculateCartTotals(this);
});

module.exports = mongoose.model("Cart", cartSchema);