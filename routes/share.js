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

    res.json({ shareId: newShare._id });
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
