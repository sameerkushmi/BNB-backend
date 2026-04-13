const User = require("../models/User");

// 🔹 Get all addresses
exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("addresses");

        res.status(200).json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔹 Add address
exports.addAddress = async (req, res) => {
    try {
        const { fullName, phone, address, city, postalCode } = req.body;

        if (!fullName || !phone || !address || !city) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const user = await User.findById(req.user.id);

        // If first address → default
        const isFirst = user.addresses.length === 0;

        const newAddress = {
            fullName,
            phone,
            address,
            city,
            postalCode,
            isDefault: isFirst,
        };

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔹 Delete address
exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);

        user.addresses = user.addresses.filter(
            (addr) => addr._id.toString() !== addressId
        );

        await user.save();

        res.status(200).json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔹 Set default address
exports.setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);

        user.addresses = user.addresses.map((addr) => ({
            ...addr._doc,
            isDefault: addr._id.toString() === addressId,
        }));

        await user.save();

        res.status(200).json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 🔹 Update address
exports.updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        Object.assign(address, req.body);

        await user.save();

        res.status(200).json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};