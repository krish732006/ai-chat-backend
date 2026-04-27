const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      default: null, // Gmail login ma password nai hoy
    },

    loginType: {
      type: String,
      enum: ["normal", "google", "face"],
      default: "normal",
    },

    faceId: {
      type: String,
      default: null, // Face recognition mate
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto add thase
  }
);

module.exports = mongoose.model("User", userSchema);