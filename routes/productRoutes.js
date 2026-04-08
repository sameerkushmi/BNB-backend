const express = require("express");
const upload = require("../middlewares/upload.js");
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductBySlug,
} = require("../controllers/product.controller.js");

const router = express.Router();

const { protect } = require('../middlewares/auth.middleware.js')
const { adminProtect } = require('../middlewares/admin.middleware.js')

// 📦 CRUD Routes
router.get("/get-all", getProducts);
router.get('/get-by-slug', getProductBySlug)

router.use(protect, adminProtect)
router.post("/add", upload.array("images", 5), createProduct);
router.get("/get-by-id/:id", getProductById);
router.put("/update/:id", upload.array("images", 5), updateProduct);
router.delete("/delete/:id", deleteProduct);

module.exports = router;