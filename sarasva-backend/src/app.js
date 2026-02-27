import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security headers
app.use(helmet());

// CORS — in production, replace origin with your frontend domain
app.use(cors({
  origin: env.NODE_ENV === "production"
    ? "https://your-sarasva-frontend.com"
    : "http://localhost:5173",
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// All API routes
app.use("/api/v1", apiRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
