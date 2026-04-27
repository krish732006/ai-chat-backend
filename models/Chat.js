const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    messages: [
      {
        text: String,
        sender: String, // user / ai
        time: String,
      },
    ],
    title: { type: String, default: "" },
    isPinned: {
      type: Boolean,
      default: false,
    },
    folder: {
      type: String,
      default: "General",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
