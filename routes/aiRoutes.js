const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Explain this image",
              },
              {
                type: "input_image",
                image_url: `data:${req.file.mimetype};base64,${base64}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json({
      result: response.data.choices[0].message.content,
    });
  } catch (err) {
    console.log("🔥 FULL ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Image processing failed" });
  }
});

router.post("/file", upload.single("file"), async (req, res) => {
  try {
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      const result = await mammoth.extractRawText({
        buffer: req.file.buffer,
      });
      text = result.value;
    }

    // send to AI
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: `Summarize this document:\n${text.slice(0, 4000)}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      },
    );

    res.json({
      result: response.data.choices[0].message.content,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "File processing failed" });
  }
});

module.exports = router;
