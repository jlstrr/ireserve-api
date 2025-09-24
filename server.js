import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database check
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use(express.json());

// Mount versioned routes
app.use("/api", apiRoutes);

app.use("/", (req, res) => {
  res.json({ message: "iReserve API is running" });
});

app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
