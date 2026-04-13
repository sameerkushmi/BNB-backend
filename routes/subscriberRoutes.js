const express = require("express");
const router = express.Router();
const {
    createSubscriber,
    getSubscribers,
    updateSubscriber,
    deleteSubscriber,
} = require("../controllers/subscriber.controller");

// Create / Subscribe
router.post("/", createSubscriber);

// Read
router.get("/", getSubscribers);

// Update
router.put("/:id", updateSubscriber);

// Delete
router.delete("/:id", deleteSubscriber);

module.exports = router;