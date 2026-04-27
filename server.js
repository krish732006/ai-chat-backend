require("dotenv").config();
const connectDB = require("./config/db");

const express = require("express");
const cors = require("cors");
const protect = require("./middleware/authMiddleware");
const session = require("express-session");
const passport = require("./config/passport");
const chatRoutes = require("./routes/chatRoutes");
const shareRoutes = require("./routes/share");


const app = express();

// Connect to MongoDB
connectDB();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// 🔐 Session setup (Google login mate)
app.use(
	session({
		secret: "secretkey",
		resave: false,
		saveUninitialized: true,
	})
);

// 🔐 Passport initialize
app.use(passport.initialize());
app.use(passport.session());

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/share", shareRoutes);

app.get("/api/protected", protect, (req, res) => {
	res.json({
		message: "This is protected data 🔐",
		user: req.user,
	});
});

app.get("/", (req, res) => {
	res.send("API is running...");
});

app.listen(PORT, async () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`👉 Open in browser: http://localhost:${PORT}`);

});