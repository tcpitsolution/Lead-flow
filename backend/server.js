const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const finderRoutes = require("./routes/finderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.set("trust proxy", 1);

connectDB();

// ---------- CORS ----------
// Allowed origins: ALLOWED_ORIGINS (comma separated) + CLIENT_URL (purana variable bhi chalega)
const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
  process.env.CLIENT_URL || "",
  "https://leadflowcrm.site",
  "http://localhost:5173",
  "http://localhost:3000",
]
  .map((o) => o.trim().replace(/\/$/, "")) // space aur last ka "/" hata do
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman, curl, payment webhooks (server-to-server) mein origin nahi hota
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("CORS blocked:", origin);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// ---------- /CORS ----------

app.use(express.json({ limit: "500kb" }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Lead CRM API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/finder", finderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route nahi mila" });
});

// Express 5 async errors yahan bhej deta hai
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res
      .status(400)
      .json({ success: false, message: "Request ka JSON galat hai" });
  if (err.name === "ValidationError")
    return res
      .status(400)
      .json({ success: false, message: Object.values(err.errors)[0].message });
  console.error(err);
  res.status(500).json({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
