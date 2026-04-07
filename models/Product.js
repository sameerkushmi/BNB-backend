const mongoose = require("mongoose");
const slugify = require("slugify");

const { Schema } = mongoose;

/* 🖼 Image Schema */
const imageSchema = new Schema(
    {
        url: { type: String, required: true },
        alt: { type: String },
        public_id: { type: String },
    },
    { _id: false }
);

/* ⭐ Review Schema (optional but scalable) */
const reviewSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        name: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
    },
    { timestamps: true }
);

/* 🎨 Variant Schema */
const variantSchema = new Schema(
    {
        name: String, // e.g. "Size", "Color"
        value: String, // e.g. "Large", "Red"
        price: Number,
        stock: { type: Number, default: 0 },
        sku: String,
    },
    { _id: false }
);

/* 📦 Main Product Schema */
const productSchema = new Schema(
    {
        // 🔤 Basic Info
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },

        // 💰 Pricing
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        discountPrice: {
            type: Number,
            min: 0,
        },

        // 📂 Category
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        // 🏷 Brand
        brand: {
            type: String,
            trim: true,
        },

        // 📦 Inventory
        stock: {
            type: Number,
            required: true,
            default: 0,
        },

        // 🎨 Variants (optional)
        variants: [variantSchema],

        // 🖼 Images
        images: {
            type: [imageSchema],
            validate: [arr => arr.length > 0, "At least one image required"],
        },

        // ⭐ Ratings
        ratingsAverage: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        ratingsCount: {
            type: Number,
            default: 0,
        },

        // 💬 Reviews
        reviews: [reviewSchema],

        // 🔍 SEO
        metaTitle: String,
        metaDescription: String,

        // 🚀 Status
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
        },

        // 🔥 Flags
        isFeatured: {
            type: Boolean,
            default: false,
        },

        // 📊 Analytics
        sold: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// 📈 Virtuals

//  🧮 Calculate discount percentage ⚡ Indexes(Performance Boost)
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

//  🧠 Middleware

// 🔗 Auto slug generate
productSchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true });
    }
    next();
});

productSchema.virtual("isLowStock").get(function () {
    return this.stock < 10;
});

productSchema.virtual("finalPrice").get(function () {
    return this.discountPrice || this.price;
});

productSchema.pre(/^find/, function (next) {
    this.find({ status: "published" });
    next();
});


//  📤 Model Export
module.exports = mongoose.model("Product", productSchema);