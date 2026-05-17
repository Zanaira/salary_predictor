import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EDUCATION_LABELS = ["Bachelor's", "Master's", "PhD"];
const LOCATION_LABELS  = ["Rural", "City", "Metro", "Capital"];
const JOB_TYPE_LABELS  = ["Junior", "Mid-level", "Senior"];

const MODEL_INFO = {
  knn:         { label: "K-Nearest Neighbors", short: "KNN", color: "#6366f1" },
  naive_bayes: { label: "Naive Bayes",          short: "NB",  color: "#f59e0b" },
  svm:         { label: "Support Vector Machine",short: "SVM",color: "#10b981" },
};

const SALARY_COLORS = { Low: "#f59e0b", Mid: "#6366f1", High: "#10b981" };
const METRIC_LABELS = { accuracy: "Accuracy", precision: "Precision", recall: "Recall", f1_score: "F1 Score" };

export default function App() {
  const [step,       setStep]      = useState(0);
  const [form,       setForm]      = useState({ experience: 3, education: 0, skills: 5, location: 1, job_type: 1, model: "svm" });
  const [result,     setResult]    = useState(null);
  const [metrics,    setMetrics]   = useState(null);
  const [history,    setHistory]   = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [pdfLoading, setPdfLoading]= useState(false);
  const [activeTab,  setActiveTab] = useState("predict");

  useEffect(() => {
    fetch(`${API}/metrics`).then(r => r.json()).then(setMetrics).catch(() => {});
    fetchHistory();
  }, []);

  const fetchHistory = () =>
    fetch(`${API}/history`).then(r => r.json()).then(setHistory).catch(() => {});

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      setStep(3);
      fetchHistory();
    } catch {
      alert("Could not connect to server. Make sure backend and Flask are running.");
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`${API}/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, ...form }),
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SalaryIQ_Report_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF generation failed. Make sure backend is running.");
    }
    setPdfLoading(false);
  };

  const reset = () => { setStep(0); setResult(null); };

  // Build comparison chart data — one group per model, 4 bars each
  const chartData = metrics
    ? ["accuracy", "precision", "recall", "f1_score"].map(metric => ({
        name:  METRIC_LABELS[metric],
        KNN:   metrics.knn?.[metric],
        NB:    metrics.naive_bayes?.[metric],
        SVM:   metrics.svm?.[metric],
      }))
    : [];

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}><span style={{ fontSize: 22 }}>💼</span><span style={s.logoText}>SalaryIQ</span></div>
        <nav style={s.nav}>
          {["predict", "compare", "history"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ ...s.navBtn, ...(activeTab === t ? s.navActive : {}) }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main style={s.main}>

        {/* ══ PREDICT TAB ══ */}
        {activeTab === "predict" && (
          <div style={s.card}>
            {step < 3 && (
              <div style={s.progressWrap}>
                {["Profile", "Job Details", "Model"].map((label, i) => (
                  <div key={i} style={s.progressItem}>
                    <div style={{ ...s.progressDot, background: i <= step ? "#6366f1" : "#e2e8f0" }}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span style={{ ...s.progressLabel, color: i <= step ? "#6366f1" : "#94a3b8" }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 0 – Profile */}
            {step === 0 && (
              <div>
                <h2 style={s.title}>Tell us about yourself</h2>
                <p style={s.sub}>We'll predict your salary range based on your profile</p>

                <label style={s.label}>Years of Experience: <b>{form.experience}</b></label>
                <input type="range" min="0" max="20" value={form.experience}
                  onChange={e => setForm({ ...form, experience: +e.target.value })} style={s.slider} />
                <div style={s.hints}><span>0 yrs</span><span>20 yrs</span></div>

                <label style={s.label}>Education Level</label>
                <div style={s.optRow}>
                  {EDUCATION_LABELS.map((l, i) => (
                    <button key={i} onClick={() => setForm({ ...form, education: i })}
                      style={{ ...s.optBtn, ...(form.education === i ? s.optActive : {}) }}>{l}</button>
                  ))}
                </div>

                <label style={s.label}>Skill Score: <b>{form.skills}/10</b></label>
                <input type="range" min="1" max="10" value={form.skills}
                  onChange={e => setForm({ ...form, skills: +e.target.value })} style={s.slider} />
                <div style={s.hints}><span>Beginner</span><span>Expert</span></div>

                <button style={s.btnPrimary} onClick={() => setStep(1)}>Next →</button>
              </div>
            )}

            {/* Step 1 – Job Details */}
            {step === 1 && (
              <div>
                <h2 style={s.title}>Job Details</h2>
                <p style={s.sub}>Where and what kind of role are you targeting?</p>

                <label style={s.label}>Location</label>
                <div style={s.optRow}>
                  {LOCATION_LABELS.map((l, i) => (
                    <button key={i} onClick={() => setForm({ ...form, location: i })}
                      style={{ ...s.optBtn, ...(form.location === i ? s.optActive : {}) }}>{l}</button>
                  ))}
                </div>

                <label style={s.label}>Job Level</label>
                <div style={s.optRow}>
                  {JOB_TYPE_LABELS.map((l, i) => (
                    <button key={i} onClick={() => setForm({ ...form, job_type: i })}
                      style={{ ...s.optBtn, ...(form.job_type === i ? s.optActive : {}) }}>{l}</button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  <button style={s.btnSecondary} onClick={() => setStep(0)}>← Back</button>
                  <button style={s.btnPrimary}   onClick={() => setStep(2)}>Next →</button>
                </div>
              </div>
            )}

            {/* Step 2 – Model Selection */}
            {step === 2 && (
              <div>
                <h2 style={s.title}>Choose Your ML Model</h2>
                <p style={s.sub}>3 classifiers available — each with full performance metrics</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {Object.entries(MODEL_INFO).map(([key, info]) => (
                    <div key={key} onClick={() => setForm({ ...form, model: key })}
                      style={{ ...s.modelCard, borderColor: form.model === key ? info.color : "#e2e8f0",
                               background: form.model === key ? info.color + "10" : "#fff" }}>
                      <div style={{ ...s.modelDot, background: info.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{info.label}</div>
                        {metrics?.[key] && (
                          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                            {["accuracy","precision","recall","f1_score"].map(m => (
                              <span key={m} style={{ fontSize: 11, color: "#64748b" }}>
                                {METRIC_LABELS[m]}: <b style={{ color: info.color }}>{metrics[key][m]}%</b>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {form.model === key && <span style={{ color: info.color, fontSize: 18 }}>✓</span>}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button style={s.btnSecondary} onClick={() => setStep(1)}>← Back</button>
                  <button style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
                    onClick={handlePredict} disabled={loading}>
                    {loading ? "Predicting..." : "🔮 Predict Salary"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 – Result */}
            {step === 3 && result && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>
                  {result.prediction === "High" ? "🚀" : result.prediction === "Mid" ? "💼" : "📈"}
                </div>
                <h2 style={{ ...s.title, marginBottom: 4 }}>Salary Range Prediction</h2>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
                  {MODEL_INFO[result.model_used]?.label}
                  {result.confidence && <> · Confidence: <b>{result.confidence}%</b></>}
                </p>

                {/* Badge */}
                <div style={{ display: "inline-block", padding: "8px 28px", borderRadius: 99,
                              fontSize: 20, fontWeight: 700, color: "#fff",
                              background: SALARY_COLORS[result.prediction], marginBottom: 24 }}>
                  {result.prediction} Income
                </div>

                {/* Salary range */}
                <div style={s.salaryBar}>
                  {["min","mid","max"].map((k, i) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                        {["Minimum","Expected","Maximum"][i]}
                      </div>
                      <div style={{ fontSize: i === 1 ? 22 : 16, fontWeight: i === 1 ? 700 : 500,
                                    color: i === 1 ? SALARY_COLORS[result.prediction] : "#334155" }}>
                        ${result.salary_range[k].toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* All 4 metrics for selected model */}
                <div style={s.metricsGrid}>
                  {["accuracy","precision","recall","f1_score"].map(m => (
                    <div key={m} style={s.metricBox}>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{METRIC_LABELS[m]}</div>
                      <div style={{ fontSize: 20, fontWeight: 700,
                                    color: MODEL_INFO[result.model_used]?.color ?? "#6366f1" }}>
                        {result[m] ?? "N/A"}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div style={s.tipBox}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.5, textAlign: "left" }}>
                    {result.tip}
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button style={s.btnSecondary} onClick={reset}>Try Again</button>
                  <button style={{ ...s.btnPrimary, opacity: pdfLoading ? 0.7 : 1, display: "flex",
                                   alignItems: "center", justifyContent: "center", gap: 8 }}
                    onClick={handleDownloadPDF} disabled={pdfLoading}>
                    {pdfLoading ? "Generating..." : "📄 Download PDF Report"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ COMPARE TAB ══ */}
        {activeTab === "compare" && (
          <div style={s.card}>
            <h2 style={s.title}>Model Performance Comparison</h2>
            <p style={s.sub}>Accuracy · Precision · Recall · F1 Score — all 3 classifiers</p>

            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis domain={[70, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="KNN" fill="#6366f1" radius={[4,4,0,0]} />
                    <Bar dataKey="NB"  fill="#f59e0b" radius={[4,4,0,0]} />
                    <Bar dataKey="SVM" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Metrics table */}
                <div style={{ marginTop: 24, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#6366f1", color: "#fff" }}>
                        {["Model","Accuracy","Precision","Recall","F1 Score"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics).map(([key, m], i) => (
                        <tr key={key} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600,
                                       color: MODEL_INFO[key]?.color }}>{MODEL_INFO[key]?.label}</td>
                          {["accuracy","precision","recall","f1_score"].map(metric => (
                            <td key={metric} style={{ padding: "10px 12px", color: "#334155" }}>
                              {m[metric]}%
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Metric explanations */}
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Accuracy",  "Overall correct predictions out of all predictions made."],
                    ["Precision", "Of predicted positives, how many are actually correct — fewer false alarms."],
                    ["Recall",    "Of actual positives, how many were correctly found — fewer misses."],
                    ["F1 Score",  "Harmonic mean of Precision & Recall — best single metric for imbalanced data."],
                  ].map(([term, desc]) => (
                    <div key={term} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                      <span style={{ color: "#6366f1", fontWeight: 700, minWidth: 72 }}>{term}:</span>
                      <span style={{ color: "#64748b" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>
                Could not load metrics. Make sure all servers are running.
              </p>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === "history" && (
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ ...s.title, margin: 0 }}>Prediction History</h2>
              {history.length > 0 && (
                <button style={s.btnDanger} onClick={async () => {
                  await fetch(`${API}/history`, { method: "DELETE" });
                  fetchHistory();
                }}>Clear All</button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <p>No predictions yet. Go make one!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((h, i) => (
                  <div key={i} style={s.histRow}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%",
                                  background: SALARY_COLORS[h.prediction], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                        {h.prediction} Income · {EDUCATION_LABELS[h.education]} · {h.experience}yr exp
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        {MODEL_INFO[h.model]?.label} · F1: {h.f1_score}% · {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: SALARY_COLORS[h.prediction],
                                  background: SALARY_COLORS[h.prediction] + "18",
                                  padding: "3px 10px", borderRadius: 99 }}>
                      ${h.salary_range?.mid?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root:         { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" },
  header:       { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 },
  logo:         { display: "flex", alignItems: "center", gap: 8 },
  logoText:     { fontSize: 18, fontWeight: 700, color: "#1e293b" },
  nav:          { display: "flex", gap: 6 },
  navBtn:       { padding: "5px 16px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#64748b" },
  navActive:    { background: "#6366f1", color: "#fff" },
  main:         { maxWidth: 680, margin: "32px auto", padding: "0 16px" },
  card:         { background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" },
  progressWrap: { display: "flex", justifyContent: "space-between", marginBottom: 28 },
  progressItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 },
  progressDot:  { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" },
  progressLabel:{ fontSize: 11, fontWeight: 500 },
  title:        { fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  sub:          { color: "#64748b", marginBottom: 22, fontSize: 13 },
  label:        { display: "block", fontWeight: 600, color: "#374151", marginBottom: 8, marginTop: 18, fontSize: 13 },
  slider:       { width: "100%", accentColor: "#6366f1" },
  hints:        { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 3 },
  optRow:       { display: "flex", gap: 8, flexWrap: "wrap" },
  optBtn:       { padding: "7px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#475569" },
  optActive:    { borderColor: "#6366f1", background: "#eef2ff", color: "#6366f1", fontWeight: 700 },
  btnPrimary:   { marginTop: 6, width: "100%", padding: "13px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  btnSecondary: { marginTop: 6, flex: 1, padding: "13px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnDanger:    { padding: "7px 14px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  modelCard:    { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1.5px solid", cursor: "pointer", transition: "all .15s" },
  modelDot:     { width: 12, height: 12, borderRadius: "50%", flexShrink: 0 },
  salaryBar:    { display: "flex", justifyContent: "space-around", background: "#f8fafc", borderRadius: 12, padding: "18px 12px", marginBottom: 20 },
  metricsGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 },
  metricBox:    { background: "#f8fafc", borderRadius: 10, padding: "12px 8px", textAlign: "center" },
  tipBox:       { display: "flex", gap: 10, alignItems: "flex-start", background: "#fefce8", borderRadius: 10, padding: "12px 16px", marginBottom: 20 },
  histRow:      { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid #f1f5f9", background: "#f8fafc" },
};
