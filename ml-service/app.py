from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import joblib, numpy as np, os, io, traceback
from pdf_report import build_report_pdf

app = Flask(__name__)
CORS(app)

# Works correctly with both 'python app.py' and 'gunicorn app:app'
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
print(f"Loading models from: {BASE}")
scaler  = joblib.load(f"{BASE}/scaler.pkl")
le      = joblib.load(f"{BASE}/label_encoder.pkl")
metrics = joblib.load(f"{BASE}/metrics.pkl")

models = {
    "knn":         joblib.load(f"{BASE}/knn.pkl"),
    "naive_bayes": joblib.load(f"{BASE}/naive_bayes.pkl"),
    "svm":         joblib.load(f"{BASE}/svm.pkl"),
}

SALARY_RANGES = {
    "Low":  {"min": 30000,  "mid": 50000,  "max": 60000},
    "Mid":  {"min": 60000,  "mid": 90000,  "max": 120000},
    "High": {"min": 120000, "mid": 150000, "max": 200000},
}
SKILL_TIPS = {
    "Low":  "Consider gaining more experience or upskilling in high-demand technologies.",
    "Mid":  "You're in a competitive range. Cloud & system design skills can push you higher.",
    "High": "Excellent profile! Leadership and specialized skills can maximize your package.",
}
MODEL_DESCRIPTIONS = {
    "knn":         "K-Nearest Neighbors classifies by finding the K closest training samples in feature space.",
    "naive_bayes": "Naive Bayes uses Bayes theorem with feature independence assumption for fast probabilistic classification.",
    "svm":         "Support Vector Machine finds the optimal hyperplane that maximizes margin between salary classes.",
}

@app.route("/health",  methods=["GET"])
def health():
    return jsonify({"status": "ok", "models": list(models.keys())})

@app.route("/metrics", methods=["GET"])
def get_metrics():
    return jsonify(metrics)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body received"}), 400

        for field in ["experience","education","skills","location","job_type","model"]:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        model_key = data["model"]
        if model_key not in models:
            return jsonify({"error": f"Unknown model: {model_key}"}), 400

        features        = np.array([[int(data["experience"]), int(data["education"]),
                                      int(data["skills"]),    int(data["location"]),
                                      int(data["job_type"])]])
        features_scaled = scaler.transform(features)
        model           = models[model_key]
        pred_enc        = model.predict(features_scaled)[0]
        label           = le.inverse_transform([pred_enc])[0]

        confidence = None
        if hasattr(model, "predict_proba"):
            proba      = model.predict_proba(features_scaled)[0]
            confidence = round(float(max(proba)) * 100, 1)

        m = metrics.get(model_key, {})
        return jsonify({
            "prediction":        label,
            "salary_range":      SALARY_RANGES[label],
            "confidence":        confidence,
            "tip":               SKILL_TIPS[label],
            "model_used":        model_key,
            "model_description": MODEL_DESCRIPTIONS[model_key],
            "accuracy":          m.get("accuracy"),
            "precision":         m.get("precision"),
            "recall":            m.get("recall"),
            "f1_score":          m.get("f1_score"),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/report", methods=["POST"])
def generate_report():
    """Generate and return a professional PDF report."""
    data = request.get_json()
    # Inject all_metrics so the comparison table is complete
    data["all_metrics"] = metrics
    try:
        pdf_bytes = build_report_pdf(data)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name="SalaryIQ_Report.pdf"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 Flask ML API running on http://localhost:5001")
    app.run(debug=True, port=5001)
