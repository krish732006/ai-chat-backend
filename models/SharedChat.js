const mongoose = require("mongoose");

const shareSchema = new mongoose.Schema({
  chatId: String,
  title: String,
  messages: Array,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SharedChat", shareSchema);
