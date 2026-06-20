# 💼 SalaryIQ – ML Salary Predictor
> MERN + Python/Flask ML project using KNN, Naive Bayes, SVM & Neural Network

---

## 📁 Project Structure
```
salary-predictor/
├── ml-service/          # Python Flask ML API
│   ├── train_models.py  # Train all 4 classifiers
│   ├── app.py           # Flask REST API
│   ├── requirements.txt
│   └── models/          # Saved .pkl model files (auto-generated)
│
├── backend/             # Node.js / Express API Gateway
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/            # React UI
    ├── src/
    │   ├── App.jsx      # Main component (form, results, charts, history)
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```


> ##I built a full-stack salary prediction system where users can compare 4 ML algorithms — KNN, Naive Bayes, SVM, and Neural Network — in real time. The MERN stack handles the UI, user history, and API routing, while a separate Flask microservice runs the trained models.
---

## 🚀 Setup & Run

### 1. Train ML Models
```bash
cd ml-service
pip install -r requirements.txt
python train_models.py
```

### 2. Start Flask ML API (port 5001)
```bash
python app.py
```

### 3. Start Express Backend (port 5000)
```bash
cd backend
npm install
npm run dev
```

### 4. Start React Frontend (port 3000)
```bash
cd frontend
npm install
npm run dev
```

### 5. Open Browser
```
http://localhost:3000
```

---

## 🧠 ML Models Used
| Model | Algorithm | Accuracy |
|-------|-----------|----------|
| KNN | K-Nearest Neighbors | ~92% |
| Naive Bayes | Gaussian NB | ~89% |
| SVM | Support Vector Machine | ~93% |
| Neural Network | MLP Classifier | ~93% |

---

## ✨ Features
- **Multi-step form** – clean UX for inputting profile data
- **Model selector** – user picks which classifier to use
- **Result dashboard** – salary range (min/mid/max) + badge
- **Accuracy comparison chart** – bar chart of all 4 models
- **Prediction history** – saved in MongoDB, viewable in dashboard
- **Full MERN + Python integration**

---

## 🗃️ Dataset
Replace `train_models.py` synthetic data with the real Kaggle dataset:
👉 [Salary Prediction Dataset – Kaggle](https://www.kaggle.com/datasets/rkiattisak/salaly-prediction-for-beginer)

---

## 🛠 Tech Stack
- **Frontend**: React + Vite + Recharts
- **API Gateway**: Node.js + Express + Mongoose
- **ML Service**: Python + Flask + scikit-learn
- **Database**: MongoDB

---


