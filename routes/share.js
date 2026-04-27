const express = require("express");
const router = express.Router();
const SharedChat = require("../models/SharedChat");

// 🔥 CREATE SHARE LINK
router.post("/", async (req, res) => {
  try {
    const { messages, chatId, title } = req.body;

    const newShare = await SharedChat.create({
      chatId,
      title,
      messages,
    });

    // 🔥 IMPORTANT: backend live URL
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    const fullLink = `${BASE_URL}/api/share/${newShare._id}`;

    res.json({
      shareId: newShare._id,
      url: fullLink, // ✅ direct usable link
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create share link" });
  }
});

// 🔥 GET SHARED CHAT
router.get("/:id", async (req, res) => {
  try {
    const chat = await SharedChat.findById(req.params.id);

    if (!chat) return res.status(404).json({ error: "Not found" });

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Error fetching chat" });
  }
});

module.exports = router;
