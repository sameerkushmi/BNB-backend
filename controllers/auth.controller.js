const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");
const { cookieOptions } = require("../utils/cookieOptions");

// 🔹 Helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(
    password
  );
};

const validatePhone = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

const getSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  status: user.status,
  lastLogin: user.lastLogin,
  addresses: user.addresses,
  wishlist: user.wishlist,
  cart: user.cart,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    let { name, email, password, confirmPassword, phone } = req.body;

    // Normalize
    email = email?.toLowerCase().trim();
    name = name?.trim();
    const cleanPhone = phone?.replace(/\D/g, "");

    // Validation
    if (!name || !email || !password || !confirmPassword || !cleanPhone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!validatePhone(cleanPhone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: cleanPhone,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 🔥 Single session (remove old tokens)
    await RefreshToken.deleteMany({ user: user._id });

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        message: "Account created successfully",
        user: getSafeUser(user),
      });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔥 Update last login
    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 🔥 Single session
    await RefreshToken.deleteMany({ user: user._id });

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        user: getSafeUser(user),
      });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REFRESH =================
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const stored = await RefreshToken.findOne({ token });

    if (!stored) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Expired or invalid token" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 Rotate token
    await RefreshToken.deleteOne({ token });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res
      .cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "Token refreshed" });
  } catch (error) {
    console.error("REFRESH ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGOUT =================
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await RefreshToken.deleteOne({ token });
    }

    res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};