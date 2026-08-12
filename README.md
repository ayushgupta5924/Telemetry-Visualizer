# LILA Player Journey Engine

A full-stack, hardware-accelerated telemetry and spatial analysis tool built for LILA extraction shooter matches. This engine ingests raw match events, maps 3D world coordinates to 2D minimaps, and provides real-time timeline scrubbing alongside GPU-accelerated heatmaps to assist level designers in analyzing player flow, engagement churn, and combat density.

---

## 🔗 Live Deliverables
* **Live Web Application:** [https://telemetry-visualizer.vercel.app](https://telemetry-visualizer.vercel.app)
* **Backend API Documentation:** [https://telemetry-visualizer.onrender.com/docs](https://telemetry-visualizer.onrender.com/docs)
* **Video Walkthrough:** [https://www.loom.com/share/fc8a83b0c4fc4728adcbe532dd99a041](https://www.loom.com/share/fc8a83b0c4fc4728adcbe532dd99a041)

---

## 📑 Core Documentation
* [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Technical deep-dive into the ingestion pipeline, coordinate mapping mathematical model, hybrid CPU/GPU rendering strategy, and system trade-offs.
* [`INSIGHTS.md`](./INSIGHTS.md) — Three actionable, telemetry-backed level design heuristics covering early-match spawn churn, economic dead zones, and bot pathfinding anomalies.

---

## 🎯 Features Checklist & Requirements Coverage

| Feature | Implementation Details |
| :--- | :--- |
| **Parquet Telemetry Ingestion** | High-throughput parsing via PyArrow/Pandas on server startup into an in-memory dataset (~89,000 events). |
| **Coordinate Mapping** | Vectorized transformation of 3D world coordinates (X, Z) to 2D minimap pixels (U, V) executed server-side. |
| **Human vs. Bot Differentiation** | Color-coded spatial vectors (Cyan for Humans, Grey for Bots). |
| **Distinct Event Markers** | Custom radii and color tokens for Kills (Red), Deaths (Black), Looting (Gold), and Storm Deaths (Purple). |
| **Multivariate Filtering** | Dynamic client-side and server-side filtering across Map IDs, Match Dates, and Match Instances. |
| **Match Progression Timeline** | Interactive scrubbing slider allowing frame-by-frame analysis of match evolution over time. |
| **Thermal Density Overlays** | Dedicated view modes for Traffic Density (movement patterns) and Combat Hotspots (kill distribution). |
| **Interactive Telemetry Inspection** | Hover tooltips detailing exact event types, player IDs, and timestamps. |

---

## 🛠️ Tech Stack

* **Backend:** Python 3.12, FastAPI, Pandas, PyArrow, Uvicorn
* **Frontend:** React (Vite), Deck.gl (WebGL/GPU Shader Acceleration)
* **Deployment & Hosting:** Render (FastAPI Engine), Vercel (React Application)

---

## 🚀 Local Setup Instructions

### Prerequisites
* Python 3.10 or higher
* Node.js v18 or higher
* `npm` or `yarn`