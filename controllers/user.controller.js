const User = require('../models/User')

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

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        await user.deleteOne()

        res.status(200).json({ message: "User removed" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};