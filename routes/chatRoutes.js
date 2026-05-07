const express = require("express");
const router = express.Router();
// const axios = require("axios");
// const fetch = require("node-fetch");
const Chat = require("../models/Chat");

router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find();
    res.json({ messages: chats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { message, chatId, userId } = req.body;

    let userMessage = message;
    let isContinue = false;

    if (message === "__CONTINUE__") {
      isContinue = true;

      const chat = await Chat.findById(chatId);

      const lastAI = chat.messages.filter((m) => m.sender === "ai").pop();

      userMessage = `Continue this:\n${lastAI?.text}`;
    }

    let chat = null;

    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    let history = [];

    if (chat) {
      history = chat.messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));
    }

    // 🔥 AI CALL (STREAM)
    // const response = await axios({
    //   method: "post",
    //   url: "https://openrouter.ai/api/v1/chat/completions",
    //   data: {
    //     model: "openai/gpt-3.5-turbo",
    //     messages: [
    //       ...history,
    //       ...(isContinue ? [] : [{ role: "user", content: message }]),
    //       { role: "user", content: userMessage },
    //     ],
    //     stream: true,
    //   },
    //   headers: {
    //     Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   responseType: "stream",
    // });

    // // 🔥 headers
    // res.setHeader("Content-Type", "text/plain");
    // res.setHeader("Transfer-Encoding", "chunked");

    // let fullReply = ""; // ✅ IMPORTANT

    // // 🔥 STREAM HANDLE
    // response.data.on("data", (chunk) => {
    //   const lines = chunk.toString().split("\n");

    //   for (let line of lines) {
    //     if (!line.startsWith("data: ")) continue;

    //     const jsonStr = line.replace("data: ", "").trim();

    //     if (!jsonStr || jsonStr === "[DONE]") continue;

    //     try {
    //       const parsed = JSON.parse(jsonStr);

    //       const choice = parsed?.choices?.[0];
    //       if (!choice) continue;

    //       const text = choice?.delta?.content || choice?.message?.content || "";

    //       if (text) {
    //         fullReply += text; // ✅ collect full text
    //         res.write(text); // ✅ send to frontend
    //       }
    //     } catch (err) {
    //       // ignore bad chunks
    //     }
    //   }
    // });

    // // 🔥 STREAM END → SAVE TO DB
    // response.data.on("end", async () => {
    //   try {
    //     let savedChat;

    //     if (chat) {
    //       if (!isContinue) {
    //         chat.messages.push({
    //           text: message,
    //           sender: "user",
    //           time: new Date().toLocaleTimeString([], {
    //             hour: "2-digit",
    //             minute: "2-digit",
    //           }),
    //         });
    //       }
    //       chat.messages.push({
    //         text: fullReply,
    //         sender: "ai",
    //         time: new Date().toLocaleTimeString([], {
    //           hour: "2-digit",
    //           minute: "2-digit",
    //         }),
    //       });

    //       await chat.save();
    //       savedChat = chat;
    //     } else {
    //       savedChat = new Chat({
    //         userId,
    //         folder: "general",
    //         messages: [
    //           ...(isContinue
    //             ? []
    //             : [
    //                 {
    //                   text: message,
    //                   sender: "user",
    //                   time: new Date().toLocaleTimeString([], {
    //                     hour: "2-digit",
    //                     minute: "2-digit",
    //                   }),
    //                 },
    //               ]),
    //           { text: fullReply, sender: "ai" },
    //         ],
    //       });

    //       await savedChat.save();
    //     }

    //     // 🔥 send chatId at end (optional future use)
    //     // res.write(JSON.stringify({ chatId: savedChat._id }));
    //     res.write(`\n__CHAT_ID__:${savedChat._id}`);

    //     res.end();
    //   } catch (err) {
    //     console.log("DB save error:", err.message);
    //     res.end();
    //   }
    // });

    // // 🔥 ERROR HANDLE
    // response.data.on("error", (err) => {
    //   console.log("Stream error:", err.message);
    //   res.end();
    // });

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // 🔥 ADD THIS
          "X-Title": "AI Chat App", // 🔥 ADD THIS
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            ...history,
            ...(isContinue ? [] : [{ role: "user", content: message }]),
            { role: "user", content: userMessage },
          ],
          stream: false,
        }),
      },
    );

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const data = await response.json();

    const fullReply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 send to frontend
    res.write(fullReply);

    // 🔥 SAVE TO DB (same as before)
    let savedChat;

    if (chat) {
      if (!isContinue) {
        chat.messages.push({ text: message, sender: "user" });
      }

      chat.messages.push({ text: fullReply, sender: "ai" });
      await chat.save();
      savedChat = chat;
    } else {
      savedChat = new Chat({
        userId,
        folder: "general",
        messages: [
          { text: message, sender: "user" },
          { text: fullReply, sender: "ai" },
        ],
      });

      await savedChat.save();
    }

    res.write(`\n__CHAT_ID__:${savedChat._id}`);
    res.end();
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.end();
  }
});

// 🔥 GET ALL CHATS FOR USER
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Chat.find({ userId }).sort({ createdAt: -1 });

    res.json(chats);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

router.get("/logout", (req, res) => {
  req.logout(() => {
    // 🔥 direct frontend par mokli de
    res.redirect("http://localhost:3000");
  });
});

router.put("/rename", async (req, res) => {
  try {
    const { chatId, title } = req.body;

    const chat = await Chat.findByIdAndUpdate(chatId, { title }, { new: true });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Rename failed" });
  }
});

router.delete("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    await Chat.findByIdAndDelete(chatId);

    res.json({ message: "Chat deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

router.put("/pin/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    chat.isPinned = !chat.isPinned;

    await chat.save();

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Pin failed" });
  }
});

// router.post("/title", async (req, res) => {
//   try {
//     const { message } = req.body;

//     const response = await axios.post(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         model: "openai/gpt-3.5-turbo",
//         messages: [
//           {
//             role: "user",
//             content: `Generate a very short 3-5 word title for this message: "${message}". Only return title.`,
//           },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         },
//       },
//     );

//     const title = response.data.choices[0].message.content;

//     res.json({ title });
//   } catch (err) {
//     res.status(500).json({ error: "Title error" });
//   }
// });

router.post("/title", async (req, res) => {
  try {
    const { message } = req.body;

    // ❌ REMOVE AI CALL

    // ✅ SIMPLE TITLE GENERATE
    const title = message.split(" ").slice(0, 5).join(" ");

    res.json({ title });
  } catch (err) {
    console.log("TITLE ERROR:", err.message);
    res.status(500).json({ error: "Title error" });
  }
});

router.put("/move-folder", async (req, res) => {
  try {
    const { chatId, folder } = req.body;

    const chat = await Chat.findById(chatId);
    chat.folder = (folder || "general").trim().toLowerCase();

    await chat.save();

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Move failed" });
  }
});

router.put("/rename-folder", async (req, res) => {
  try {
    const { oldName, newName, userId } = req.body;

    await Chat.updateMany(
      { userId, folder: oldName },
      { $set: { folder: newName } },
    );

    res.json({ message: "Folder renamed" });
  } catch (err) {
    res.status(500).json({ error: "Rename folder failed" });
  }
});

router.put("/delete-folder", async (req, res) => {
  try {
    const { folderName, userId } = req.body;

    // 🔥 all chats → general ma move
    await Chat.updateMany(
      { userId, folder: folderName },
      { $set: { folder: "general" } },
    );

    res.json({ message: "Folder deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete folder failed" });
  }
});

module.exports = router;
