const User = require("../models/User");

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
        label: labels[score - 1] || "Weak",
    };
};

// 🔹 Update Profile (name, email, phone)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Check email uniqueness (important)
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        // ✅ Check phone uniqueness (important)
        if (phone && phone !== user.phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({ message: "Phone already in use" });
            }
            user.phone = phone;
        }

        user.name = name || user.name;

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

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