# ♻️ SwachhDisha AI
### AI-Powered Smart Waste Management & Urban Cleanliness Platform

**Building cleaner cities through intelligent waste management, data-driven insights, and smarter civic operations.**

SwachhDisha AI is a smart waste management platform designed to support urban cleanliness and municipal waste operations. It combines a modern web interface with a Python-based backend, machine-learning modules, and route-optimization capabilities to support smarter waste collection and civic management workflows.

Developed as a project for **WasteChakra 2026 — IIT Delhi × Municipal Corporation of Delhi (MCD)**.

---

## ✨ Key Modules

- **🗺️ DumpSpot** — A dedicated interface for exploring and managing waste-dump-related workflows.
- **🏙️ NagarMirror** — An urban cleanliness and city-insights interface.
- **🚛 SwachhTrack** — A dedicated module for waste-management and tracking workflows.
- **👥 Citizen View** — A citizen-facing interface for accessing platform features.
- **🌆 City Transformation** — A city-focused interface for presenting cleanliness and urban transformation.
- **🤖 Machine Learning** — Python-based ML modules for waste-management-related model training and prediction workflows.
- **📍 Route Optimization** — Backend routing functionality designed to support optimized operational routes.
- **🧹 Municipal Operations** — Backend modules for bins, cleaning, complaints, vehicles, and waste-related workflows.

*The availability and behavior of individual features depend on the current implementation and configuration.*

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, CSS |
| Maps & Visualization | Leaflet, 3D interface components |
| Backend | Python, FastAPI |
| Data Validation | Pydantic |
| Database | SQLAlchemy, SQLite configuration |
| Machine Learning | scikit-learn |
| Optimization | Google OR-Tools |

---

## 📂 Project Structure

```text
SwachhDisha-AI/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── db_models.py
│   ├── models.py
│   ├── data.py
│   ├── seed.py
│   ├── requirements.txt
│   ├── ml/
│   │   ├── train_model.py
│   │   └── train_dumpspot_model.py
│   └── routers/
│       ├── bins.py
│       ├── cleaning.py
│       ├── complaints.py
│       ├── predict.py
│       ├── routing.py
│       ├── vehicles.py
│       └── waste.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── start_backend.bat
├── start_frontend.bat
└── .gitignore
```

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following tools before starting:

- Python
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Ramankumar26/SwachhDisha-AI.git
cd SwachhDisha-AI
```

### 2. Set up the backend

Open a terminal in the project directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in a local `.env` file according to the application's configuration.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend should be accessible at:

- API: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open another terminal in the project directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

> **Note:** The frontend is configured to communicate with a local backend at port `8000`. Make sure the backend is running and its environment configuration is correct.

---
## 🧠 Why SwachhDisha AI?

Urban waste management involves multiple operational workflows, from collection and routing to cleanliness monitoring and civic coordination.

SwachhDisha AI brings these workflows together in a single web platform, with the goal of making waste-management operations more organized, accessible, and data-driven.

### Project Goals

- Support smarter waste-management workflows.
- Bring multiple municipal operations into one platform.
- Explore machine learning for waste-related prediction tasks.
- Support route-optimization workflows.
- Provide dedicated interfaces for citizens and city operations.

---

## 🛣️ Future Scope

Potential areas for further development include:

- Real-time waste collection and vehicle tracking.
- Integration with live municipal datasets and IoT sensors.
- Advanced cleanliness analytics and interactive dashboards.
- Improved model evaluation and explainable ML insights.
- Cloud deployment and production monitoring.
- Role-based access control for different stakeholders.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing your contribution.

---

## 📄 License

A license has not yet been specified. Add an appropriate license before permitting reuse or redistribution of this project.

---

**SwachhDisha AI — Towards cleaner cities and smarter waste management. ♻️**
