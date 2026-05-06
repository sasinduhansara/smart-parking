import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "*"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/smartparking",
);
mongoose.connection.on("connected", () => console.log("✅ MongoDB connected"));
mongoose.connection.on("error", (err) =>
  console.error("❌ MongoDB error:", err),
);

// ==================== Parking State ====================
let parkingState = {
  count: 0,
  totalSlots: 6,
  gateOpen: false,
};

// ==================== User Schema ====================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

// ==================== Routes ====================
app.get("/", (req, res) => {
  res.json({ message: "Smart Parking API is running 🚗" });
});

// Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" },
    );
    res.json({ token, user: { id: user._id, name, email } });
  } catch (err) {
    res.status(400).json({ message: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" },
    );
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Parking
app.get("/api/parking/status", (req, res) => {
  res.json({
    count: parkingState.count,
    totalSlots: parkingState.totalSlots,
    available: parkingState.totalSlots - parkingState.count,
  });
});

app.post("/api/parking/update", (req, res) => {
  const { action, count } = req.body;
  parkingState.count = count;
  console.log(`🚗 [${action?.toUpperCase()}] Vehicle count: ${count}`);
  res.json({ success: true, count: parkingState.count });
});

// Gate
app.get("/api/gate/status", (req, res) => {
  res.json({ open: parkingState.gateOpen });
});

app.post("/api/gate/open", (req, res) => {
  parkingState.gateOpen = true;
  console.log("🔓 Gate OPEN command sent!");
  res.json({ success: true, message: "Gate opened successfully" });
});

app.post("/api/gate/reset", (req, res) => {
  parkingState.gateOpen = false;
  console.log("🔒 Gate CLOSED / reset");
  res.json({ success: true });
});

// Booking
app.post("/api/booking", (req, res) => {
  const { spotId } = req.body;
  if (parkingState.count >= parkingState.totalSlots) {
    return res.status(400).json({ message: "Parking is full!" });
  }
  parkingState.count++;
  console.log(
    `📋 Booking confirmed - Spot ${spotId} | Count: ${parkingState.count}`,
  );
  res.json({
    success: true,
    spotId,
    count: parkingState.count,
    available: parkingState.totalSlots - parkingState.count,
  });
});

// Payment
app.post("/api/payment", (req, res) => {
  const { spotId, amount } = req.body;
  console.log(`💳 Payment received - Spot ${spotId} | Amount: ${amount}`);
  res.json({
    success: true,
    spotId,
    amount,
    transactionId: "TXN" + Date.now(),
    message: "Payment successful",
  });
});

// ==================== Error Handler ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// ==================== Start Server ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
