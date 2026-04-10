const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String },
        isDefault: { type: Boolean, default: false },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
        },

        phone: {
            type: String,
            unique: true,
            sparse: true, // allows null but unique if present
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false, // 🔒 hide by default
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        isPhoneVerified: {
            type: Boolean,
            default: false,
        },

        addresses: [addressSchema],

        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],

        cart: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
            },
        ],

        avatar: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "suspended", "deleted"],
            default: "active",
        },

        lastLogin: {
            type: Date,
        },

        passwordChangedAt: Date,
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTime = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTime;
    }
    return false;
};

const User = mongoose.model("User", userSchema);
module.exports = User;