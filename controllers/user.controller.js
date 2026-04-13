const User = require('../models/User')
const cloudinary = require("../config/cloudinary.js");

const checkPasswordStrength = (password) => {
    let score = 0;

    if (!password) return { score: 0, label: "Empty" };

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ["Weak", "Fair", "Good", "Strong"];

    return {
        score,
        label: labels[Math.max(score - 1, 0)] || "Weak",
    };
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ user });
    } catch (error) {
        console.log('get me error', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const role = req.query.role || "ALL";

        const skip = (page - 1) * limit;

        // 🔍 base search filter
        let searchQuery = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        // 🎯 role filter (ADMIN / USER / ALL)
        if (role && role !== "ALL") {
            searchQuery.role = role.toLowerCase();
        }

        // 📦 fetch users
        const users = await User.find(searchQuery)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 📊 total count
        const totalUsers = await User.countDocuments(searchQuery);
        const pages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            users,
            totalUsers,
            page,
            pages,
        });
    } catch (error) {
        console.log("get all users error", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, name, isBlocked } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (role) user.role = role;
        if (name) user.name = name;
        if (typeof isBlocked !== "undefined") user.isBlocked = isBlocked;

        await user.save();

        res.status(200).json({ message: "User updated", user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// 🔥 Update Profile Controller
exports.updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const userId = req.user.id;
        const { name, phone } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update basic fields
        if (name) user.name = name;
        if (phone) user.phone = phone;

        // 🔥 If new image uploaded
        if (req.file) {
            // ✅ Delete old image from Cloudinary
            if (user.avatar && user.avatar.public_id) {
                await cloudinary.uploader.destroy(user.avatar.public_id);
            }

            // ✅ Save new image
            user.avatar = {
                url: req.file.path,
                alt: user.name || "User Avatar",
                public_id: req.file.filename
            };
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });

    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating profile",
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.avatar && user.avatar.public_id) {
            await cloudinary.uploader.destroy(user.avatar.public_id);
        }

        await user.deleteOne()

        res.status(200).json({ message: "User removed" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) return res.status(404).json({ message: "User not found" })

        res.status(200).json({ user })
    } catch (error) {
        console.log("get user by id error", error);
        res.status(500).json({ message: "Server Error" });
    }
}

// 🔹 Change Password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // ❗ check confirm password
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // 🔥 PASSWORD STRENGTH CHECK (NEW)
        const strength = checkPasswordStrength(newPassword);

        if (strength.score < 4) {
            return res.status(400).json({
                message: "Password is too weak. Use a strong password.",
                strength,
            });
        }

        const user = await User.findById(userId).select("+password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ check current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // ❌ prevent reuse
        const isSame = await user.comparePassword(newPassword);
        if (isSame) {
            return res.status(400).json({
                message: "New password cannot be same as old password",
            });
        }

        // 🔐 set new password (will be hashed via pre-save hook)
        user.password = newPassword;

        // 📌 track password change time
        user.passwordChangedAt = Date.now();

        await user.save();

        return res.json({
            message: "Password changed successfully",
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};