import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os

np.random.seed(42)
n = 1000

experience = np.random.randint(0, 20, n)
education  = np.random.choice([0, 1, 2], n)
skills     = np.random.randint(1, 10, n)
location   = np.random.choice([0, 1, 2, 3], n)
job_type   = np.random.choice([0, 1, 2], n)

salary = (
    experience * 2000 +
    education  * 15000 +
    skills     * 3000 +
    location   * 10000 +
    job_type   * 20000 +
    np.random.normal(0, 5000, n)
)

def label_salary(s):
    if s < 60000:  return "Low"
    if s < 120000: return "Mid"
    return "High"

labels = np.array([label_salary(s) for s in salary])

df = pd.DataFrame({
    "experience": experience, "education": education,
    "skills": skills, "location": location,
    "job_type": job_type, "salary_range": labels
})
df.to_csv("dataset.csv", index=False)
print("Dataset:", df["salary_range"].value_counts().to_dict())

X = df.drop("salary_range", axis=1).values
y = df["salary_range"].values

le = LabelEncoder()
y_enc = le.fit_transform(y)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_enc, test_size=0.2, random_state=42
)

# ── Only 3 classifiers ────────────────────────────────────────────────────
models = {
    "knn":         KNeighborsClassifier(n_neighbors=5),
    "naive_bayes": GaussianNB(),
    "svm":         SVC(kernel="rbf", probability=True),
}

os.makedirs("models", exist_ok=True)
all_metrics = {}

for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    acc  = round(accuracy_score(y_test, preds) * 100, 2)
    prec = round(precision_score(y_test, preds, average="weighted", zero_division=0) * 100, 2)
    rec  = round(recall_score(y_test, preds, average="weighted", zero_division=0) * 100, 2)
    f1   = round(f1_score(y_test, preds, average="weighted", zero_division=0) * 100, 2)

    all_metrics[name] = {
        "accuracy":  acc,
        "precision": prec,
        "recall":    rec,
        "f1_score":  f1,
    }

    joblib.dump(model, f"models/{name}.pkl")
    print(f"  {name:15s} → Acc:{acc}%  Prec:{prec}%  Rec:{rec}%  F1:{f1}%")

joblib.dump(scaler, "models/scaler.pkl")
joblib.dump(le,     "models/label_encoder.pkl")
joblib.dump(all_metrics, "models/metrics.pkl")

print("\n✅ All 3 models trained and saved!")
print("Metrics:", all_metrics)
