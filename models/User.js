const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
    {
        fullName: { type: String },
        phone: { type: String },
        address: { type: String },
        city: { type: String},
        postalCode: { type: String },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
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
            required: true,
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

        avatar: {
            url: { type: String},
            alt: { type: String },
            public_id: { type: String },
        },

        isBlocked: {
            type: Boolean,
            default: false,
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