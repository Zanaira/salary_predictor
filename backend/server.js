const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const axios    = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

app.get("/api/health",  (req, res) => res.json({ status: "ok" }));

app.get("/api/metrics", async (req, res) => {
  try {
    const { data } = await axios.get(`${ML_API}/metrics`);
    res.json(data);
  } catch { res.status(500).json({ error: "ML service unavailable" }); }
});

app.post("/api/predict", async (req, res) => {
  try {
    const { data } = await axios.post(`${ML_API}/predict`, req.body);
    await new Prediction({ ...req.body, ...data }).save();
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Prediction failed" });
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

// ── PDF Report — proxy to Flask (reportlab generates it) ──────────────────
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
app.listen(PORT, () => console.log(`🚀 Express server running on http://localhost:${PORT}`));
