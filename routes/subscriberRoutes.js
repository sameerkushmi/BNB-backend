const express = require("express");
const router = express.Router();
const {
    createSubscriber,
    getSubscribers,
    getSubscriberById,
    updateSubscriber,
    deleteSubscriber,
    unsubscribe
} = require("../controllers/subscriber.controller");

// Create / Subscribe
router.post("/", createSubscriber);

// Read
router.get("/", getSubscribers);
router.get("/:id", getSubscriberById);

// Update
router.put("/:id", updateSubscriber);

// Delete
router.delete("/:id", deleteSubscriber);

// Unsubscribe (soft delete)
router.post("/unsubscribe", unsubscribe);

module.exports = router;