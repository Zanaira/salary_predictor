const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const axios    = require("axios");
require("dotenv").config();

const app = express();

// ── CORS — must be before everything else ──────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,        // set this on Render
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    // also allow all vercel.app previews automatically
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(new Error("CORS not allowed: " + origin));
  },
  methods:     ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ── MongoDB ────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/salarypredictor")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const predictionSchema = new mongoose.Schema({
  experience: Number, education: Number, skills: Number,
  location: Number, job_type: Number, model: String,
  prediction: String, salary_range: Object,
  confidence: Number, accuracy: Number, precision: Number,
  recall: Number, f1_score: Number, tip: String,
  model_description: String,
  createdAt: { type: Date, default: Date.now },
});
const Prediction = mongoose.model("Prediction", predictionSchema);
const ML_API = process.env.ML_API || "http://localhost:5001";

// ── Routes ─────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/metrics", async (req, res) => {
  try {
    const { data } = await axios.get(`${ML_API}/metrics`);
    res.json(data);
  } catch { res.status(500).json({ error: "ML service unavailable" }); }
});

// Calls Flask with one safe sequential retry on cold-start errors
// (429 = rate limited while booting, 502/503 = service waking up)
async function callMLApi(path, body) {
  const RETRYABLE = [429, 502, 503];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await axios.post(`${ML_API}${path}`, body, { timeout: 40000 });
    } catch (err) {
      const status = err.response?.status;
      if (attempt === 1 && RETRYABLE.includes(status)) {
        console.log(`⏳ ML API returned ${status}, waiting 4s then retrying once...`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw err;
    }
  }
}

app.post("/api/predict", async (req, res) => {
  try {
    console.log("📨 Predict request body:", req.body);
    console.log("📡 Calling ML_API:", `${ML_API}/predict`);

    const { data } = await callMLApi("/predict", req.body);

    console.log("✅ Flask responded:", data);

    await new Prediction({ ...req.body, ...data }).save();
    res.json(data);
  } catch (err) {
    console.error("❌ PREDICT ERROR:");
    console.error("  Message:", err.message);
    if (err.response) {
      console.error("  Flask status:", err.response.status);
      console.error("  Flask data:", JSON.stringify(err.response.data));
    } else if (err.request) {
      console.error("  No response received from Flask (timeout or unreachable)");
    } else {
      console.error("  Error before request was even sent:", err.stack);
    }
    res.status(500).json({
      error: "Prediction failed",
      detail: err.response?.data?.error || err.message,
    });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const history = await Prediction.find().sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch { res.status(500).json({ error: "Could not fetch history" }); }
});

app.delete("/api/history", async (req, res) => {
  try {
    await Prediction.deleteMany({});
    res.json({ message: "History cleared" });
  } catch { res.status(500).json({ error: "Could not clear history" }); }
});

app.post("/api/report", async (req, res) => {
  try {
    const response = await axios.post(`${ML_API}/report`, req.body, {
      responseType: "arraybuffer",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="SalaryIQ_Report.pdf"`);
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("PDF proxy error:", err.message);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Express running on port ${PORT}`));
