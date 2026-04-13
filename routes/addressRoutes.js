const express = require("express");
const router = express.Router();
const {
    getAddresses,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    updateAddress,
} = require("../controllers/address.controller");

const { protect } = require("../middlewares/auth.middleware");

// 🔐 All routes protected
router.use(protect);

router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);
router.put("/default/:addressId", setDefaultAddress);

module.exports = router;