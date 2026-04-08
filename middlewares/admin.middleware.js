const User = require('../models/User')

module.exports = {
    adminProtect: async (req, res, next) => {
        try {
            const { id } = req.user
            if (!id)
                return res.status(401).json({ message: "Unauthorized" })

            const admin = await User.findById(id)

            if (!admin)
                return res.status(401).json({ message: "Unauthorized" })

            if (admin.role !== 'admin')
                return res.status(401).json({ message: "Unauthorized" })

            next()

        } catch (error) {
            return res.status(401).json({ message: "Invalid token" });
        }

    }
}