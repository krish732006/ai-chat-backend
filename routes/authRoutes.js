const express = require("express");
const router = express.Router();
const passport = require("passport");

const { registerUser, loginUser } = require("../controllers/authController");

// Register route
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Google login start
router.get(
	"/google",
	passport.authenticate("google", {
		scope: ["profile", "email"],
		prompt: "select_account", // 🔥 MAIN FIX
	})
);

// Google callback
const jwt = require("jsonwebtoken");

router.get(
	"/google/callback",
	passport.authenticate("google", {
		failureRedirect: "http://localhost:3000",
		session: true,
	}),
	(req, res) => {

		const name = req.user.displayName || req.user.name || "User";

		const token = jwt.sign(
			{ id: req.user.id }, // 🔥 FIXED
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		res.redirect(
			`http://localhost:3000/chat?token=${token}&name=${encodeURIComponent(name)}`
		);
	}
);

router.get("/logout", (req, res) => {
	req.logout(() => {
		// 🔥 direct frontend par mokli de
		res.redirect("http://localhost:3000");
	});
});
module.exports = router;