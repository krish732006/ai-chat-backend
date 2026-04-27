const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const { registerUser, loginUser } = require("../controllers/authController");

// 🔥 ADD THIS
const FRONTEND_URL = "https://ai-chat-frontend-theta.vercel.app";

// Register route
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Google login start
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: FRONTEND_URL, // ✅ FIX
    session: true,
  }),
  (req, res) => {
    const name = req.user.displayName || req.user.name || "User";

    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // ✅ FIX
    res.redirect(
      `${FRONTEND_URL}/chat?token=${token}&name=${encodeURIComponent(name)}`,
    );
  },
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    // ✅ FIX
    res.redirect(FRONTEND_URL);
  });
});

module.exports = router;
