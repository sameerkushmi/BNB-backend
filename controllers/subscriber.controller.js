const Subscriber = require("../models/Subscriber");

// ✅ CREATE (Subscribe)
exports.createSubscriber = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const existing = await Subscriber.findOne({ email });

        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                await existing.save();

                return res.status(200).json({
                    success: true,
                    message: "Subscription re-activated",
                    data: existing,
                });
            }

            return res.status(409).json({
                success: false,
                message: "Already subscribed",
            });
        }

        const subscriber = await Subscriber.create({ email });

        res.status(201).json({
            success: true,
            message: "Subscribed successfully",
            data: subscriber,
        });

    } catch (error) {
        console.error("Create Subscriber Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ✅ READ ALL (Admin)
exports.getSubscribers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;

        const query = {
            email: { $regex: search, $options: "i" },
        };

        const subscribers = await Subscriber.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Subscriber.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: subscribers,
        });

    } catch (error) {
        console.error("Get Subscribers Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ✅ UPDATE (optional - usually not needed except admin)
exports.updateSubscriber = async (req, res) => {
    try {
        const { email, isActive } = req.body;

        const subscriber = await Subscriber.findById(req.params.id);

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: "Subscriber not found",
            });
        }

        if (email) subscriber.email = email;
        if (typeof isActive === "boolean") subscriber.isActive = isActive;

        await subscriber.save();

        res.status(200).json({
            success: true,
            message: "Subscriber updated",
            data: subscriber,
        });

    } catch (error) {
        console.error("Update Subscriber Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ✅ DELETE (Hard delete)
exports.deleteSubscriber = async (req, res) => {
    try {
        const subscriber = await Subscriber.findById(req.params.id);

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: "Subscriber not found",
            });
        }

        await subscriber.deleteOne();

        res.status(200).json({
            success: true,
            message: "Subscriber deleted",
        });

    } catch (error) {
        console.error("Delete Subscriber Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};