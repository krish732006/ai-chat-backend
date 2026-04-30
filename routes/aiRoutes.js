const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([
      "Explain this image in simple words",
      imagePart,
    ]);

    const response = await result.response;
    const text = response.text();

    res.json({ result: text });
  } catch (err) {
    console.log("🔥 GEMINI ERROR:", err.message);
    res.status(500).json({ error: "Image processing failed" });
  }
});

router.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        buffer: req.file.buffer,
      });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Only PDF/DOCX allowed" });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        max_tokens: 300, // 🔥 FIX
        messages: [
          {
            role: "user",
            content: `Summarize this document:\n${text.slice(0, 3000)}`,
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
    console.log("FILE ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "File processing failed" });
  }
});

module.exports = router;
