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
        const { name, description, price, category, stock } = req.body;

        // 🖼 Images from Cloudinary (store public_id for deletion later)
        const images = (req.files || []).map(file => ({
            url: file.path,
            alt: name,
            public_id: file.filename || extractPublicId(file.path),
        }));

        const product = await Product.create({
            name,
            slug: slugify(name, { lower: true }),
            description,
            price,
            category,
            stock,
            images,
            status: "published",
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
        const { search, page = 1, limit = 10 } = req.query;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const products = await Product.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

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


/* ✏️ UPDATE PRODUCT */
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // 🖼 Replace images if new files uploaded (delete old Cloudinary images)
        if (req.files && req.files.length > 0) {
            // delete previous images from Cloudinary
            for (const img of product.images || []) {
                const publicId = img.public_id || extractPublicId(img.url);
                if (publicId) {
                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (err) {
                        // log and continue
                        console.warn('Failed to delete Cloudinary image:', publicId, err.message || err);
                    }
                }
            }

            // set new images
            product.images = req.files.map(file => ({
                url: file.path,
                alt: product.name,
                public_id: file.filename || extractPublicId(file.path),
            }));
        }

        // 🧠 Update fields
        Object.assign(product, req.body);

        // 🔗 Update slug if name changed
        if (req.body.name) {
            product.slug = slugify(req.body.name, { lower: true });
        }

        await product.save();

        res.json({
            success: true,
            product,
        });
    } catch (error) {
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