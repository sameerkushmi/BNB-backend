// utils/generateTokens.js
const jwt = require("jsonwebtoken");

module.exports = {
    generateAccessToken: (user) => {
        return jwt.sign(
            { id: user._id},
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRATION } // short-lived
        );
    },
    generateRefreshToken: (user) => {
        return jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRATION } // long-lived
        );
    }
};