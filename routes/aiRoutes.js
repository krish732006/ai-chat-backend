const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
// const axios = require("axios");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleGenAI } = require("@google/genai");
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/authMiddleware");

// 🔥 Gemini setup
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ================= IMAGE ROUTE (GEMINI) =================
router.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const base64 = req.file.buffer.toString("base64");

      const imageBase64 = `data:${req.file.mimetype};base64,${base64}`;

      // 🔥 OPENROUTER CALL
      // const response = await axios.post(
      //   "https://openrouter.ai/api/v1/chat/completions",
      //   {
      //     model: "openai/gpt-4o-mini",
      //     max_tokens: 200,
      //     messages: [
      //       {
      //         role: "user",
      //         content: [
      //           { type: "text", text: "Explain this image simply" },
      //           {
      //             type: "image_url",
      //             image_url: {
      //               url: imageBase64,
      //             },
      //           },
      //         ],
      //       },
      //     ],
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      //       "Content-Type": "application/json",
      //     },
      //   },
      // );

      // const aiText =
      //   response.data.choices?.[0]?.message?.content || "No response";

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: "Explain this image simply" },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      const aiText = response.text || "No response";

      // ✅ SAVE TO DB
      await Chat.create({
        userId: req.userId,
        messages: [
          {
            type: "image", // 🔥 IMPORTANT
            image: imageBase64,
            sender: "user",
          },
          {
            text: aiText,
            sender: "ai",
          },
        ],
      });

      // ✅ RESPONSE SEND
      res.json({
        result: aiText,
        image: imageBase64, // 🔥 frontend mate
      });
    } catch (err) {
      console.log("🔥 IMAGE ERROR:", err.response?.data || err.message);
      res.status(500).json({ error: "Image processing failed" });
    }
  },
);

// ================= FILE ROUTE =================
router.post(
  "/file",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let text = "";

      // ✅ PDF
      if (req.file.mimetype === "application/pdf") {
        const data = await pdfParse(req.file.buffer);
        text = data.text;

        // ✅ DOCX
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

      // 🔥 text limit (important)
      const trimmedText = text.slice(0, 3000);

      // ✅ GEMINI CALL (FREE)
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Summarize this document in simple words:\n\n${trimmedText}`,
              },
            ],
          },
        ],
      });

      const aiText = response.text || "No response";

      // ✅ SAVE TO DB (optional but recommended)
      await Chat.create({
        userId: req.userId,
        messages: [
          {
            text: "File uploaded",
            sender: "user",
          },
          {
            text: aiText,
            sender: "ai",
          },
        ],
      });

      res.json({
        result: aiText,
      });
    } catch (err) {
      console.log("🔥 FILE ERROR:", err);
      res.status(500).json({ error: "File processing failed" });
    }
  },
);

// test change
module.exports = router;
