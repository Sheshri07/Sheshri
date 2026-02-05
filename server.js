import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import axios from "axios";
import { Server } from "socket.io";

// ROUTES
import authRoutes from "./routes/auth.js";
import userRoute from "./routes/user.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/order.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import messageRoutes from "./routes/message.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ---------- ALLOWED ORIGINS ----------
const allowedOrigins = [
  "http://localhost:3000",
  "https://sheshri.netlify.app",
  process.env.CLIENT_URL,
].filter(Boolean);

// ---------- CORS (TOKEN-BASED, SAFARI SAFE) ----------
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ---------- MIDDLEWARE ----------
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// ---------- HTTP + SOCKET.IO ----------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// ---------- MONGODB CONNECTION ----------
const connectDB = async () => {
  try {
    console.log("⏳ Connecting to MongoDB…");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    });

    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠ MongoDB disconnected!");
});

// ---------- API ROUTES ----------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/categories", categoryRoutes);

// ---------- GLOBAL ERROR HANDLER ----------
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  res.status(status).json({
    success: false,
    status,
    message,
  });
});

// ---------- START SERVER ---------- 
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
