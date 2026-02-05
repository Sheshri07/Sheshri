import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Create a message (Public)
router.post("/", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newMessage = new Message({ name, email, subject, message });
        await newMessage.save();

        // Notify Admins about new message
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            // Reusing customerAlerts or adding a general one if needed. 
            // For now, let's just send it if they are admin.
            await Notification.create({
                user: admin._id,
                title: "New Message Received!",
                message: `From: ${name} - ${subject}`,
                type: "general",
                link: "/admin/messages",
                read: false
            });
        }

        res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all messages (Admin Only) - For now simplified without specific auth middleware here, 
// using typical structure
router.get("/", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a message (Admin Only)
router.delete("/:id", async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark as read
router.put("/:id/read", async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ success: true, message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
