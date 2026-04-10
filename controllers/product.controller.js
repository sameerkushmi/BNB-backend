const Product = require("../models/Product.js");
const slugify = require("slugify");
const cloudinary = require("../config/cloudinary.js");

// Fallback extractor for public_id from a Cloudinary URL
function extractPublicId(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let remainder = parts[1];
        const segments = remainder.split('/');
        // remove version segment if present (e.g. v1623456789)
        if (segments[0].startsWith('v') && /^v\d+$/.test(segments[0])) segments.shift();
        let publicId = segments.join('/');
        // strip extension
        publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
        return publicId;
    } catch (err) {
        return null;
    }
}

/* 📦 CREATE PRODUCT */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            brand,
            description,
            role,
            price,
            weight,
            category,
            stock,
            isFeatured,
            status
        } = req.body;

        // 🖼 Images from Cloudinary (store public_id for deletion later)
        const images = (req.files || []).map(file => ({
            url: file.path,
            alt: name,
            public_id: file.filename || extractPublicId(file.path),
        }));

        const product = await Product.create({
            name,
            slug: slugify(name, { lower: true }),
            brand,
            description,
            role,
            price,
            weight,
            category,
            stock,
            images,
            status: "published",
            isFeatured
        });

        res.status(201).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/* 📥 GET ALL PRODUCTS */
exports.getProducts = async (req, res) => {
    try {
        const {
            search,
            page = 1,
            limit = 10,
            admin,
            status,
            category,
            role,
            priceSort, // "high" | "low"
        } = req.query;

        const query = {};

        // 🔐 Public vs Admin
        if (!admin) {
            query.status = "published";
        } else if (status && status !== "all") {
            query.status = status;
        }

        // 🔍 Search
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        // 📦 Category filter
        if (category && category !== "all") {
            query.category = { $in: category.split(",") };
            // assuming field name = category (green/herbal/black)
        }

        // 👤 Role filter (who can access / belongs to)
        if (role && role !== "all") {
            query.role = role;
            // assuming field name = role (customer/merchant)
        }

        // 💰 Sorting
        let sortOption = { createdAt: -1 }; // default latest

        if (priceSort === "high") {
            sortOption = { price: -1 };
        } else if (priceSort === "low") {
            sortOption = { price: 1 };
        }

        // 📄 Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            products,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET FEATURED PRODUCTS 
exports.getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true, status: "published" }).limit(8);

        res.json({ success: true, products });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/* 📄 GET SINGLE PRODUCT */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET PRODUCTS BY SLUG
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })

        if (!product) return res.status(404).json({ message: "Product not found" })

        res.json(product)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

/* ✏️ UPDATE PRODUCT */
exports.updateProduct = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // 1️⃣ Handle fields except images and reviews
        const fieldsToUpdate = { ...req.body };
        delete fieldsToUpdate.images;
        delete fieldsToUpdate.reviews;

        Object.keys(fieldsToUpdate).forEach(key => {
            // Convert numeric fields from string if needed
            if (["price", "discountPrice", "weight", "stock"].includes(key)) {
                product[key] = Number(fieldsToUpdate[key]);
            } else if (key === "isFeatured") {
                product[key] = fieldsToUpdate[key] === "true" || fieldsToUpdate[key] === true;
            } else {
                product[key] = fieldsToUpdate[key];
            }
        });

        // 2️⃣ Update slug if name changed
        if (fieldsToUpdate.name) {
            product.slug = slugify(fieldsToUpdate.name, { lower: true });
        }

        // 3️⃣ Handle images if new files uploaded
        if (req.files && req.files.length > 0) {
            // Delete old images from Cloudinary
            for (const img of product.images || []) {
                const publicId = img.public_id || extractPublicId(img.url);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            }

            // Set new images
            product.images = req.files.map(file => ({
                url: file.path,
                alt: product.name,
                public_id: file.filename || extractPublicId(file.path),
            }));
        }

        await product.save();

        res.json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/* ❌ DELETE PRODUCT */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // remove images from Cloudinary
        for (const img of product.images || []) {
            const publicId = img.public_id || extractPublicId(img.url);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.warn('Failed to delete Cloudinary image during product deletion:', publicId, err.message || err);
                }
            }
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: "Product deleted",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};