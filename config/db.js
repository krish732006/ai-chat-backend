const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // MongoDB connect
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected ✅`);
  } catch (error) {
    console.error("MongoDB Connection Error ❌:", error.message);

    // App bandh kari de jo error aave
    process.exit(1);
  }
};

module.exports = connectDB;