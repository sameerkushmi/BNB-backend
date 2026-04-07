const express = require("express");
const upload = require("../middlewares/upload.js");
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/product.controller.js");

const router = express.Router();

// 📦 CRUD Routes
router.post("/", upload.array("images", 5), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;