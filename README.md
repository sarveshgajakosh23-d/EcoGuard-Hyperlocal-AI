# EcoGuard 2.0: AI-Powered Hyperlocal Pollution Intelligence

## 🚀 Overview
EcoGuard 2.0 is a next-generation civic-tech platform for municipal air quality management. It upgrades standard monitoring with **Source Fingerprinting**, **Emergency Alerting**, and **Citizen Health Exposure Tracking**.

## 🏗️ System Architecture
1.  **IoT Ingestion**: Simulated street-level sensors providing PM2.5, PM10, CO2, and Wind vectors.
2.  **AI Processing (Gemini 3.1 Pro)**: Multi-modal analysis correlating sensor ratios with weather and citizen reports.
3.  **Source Detection**: Algorithm-driven classification of pollution origins (Traffic, Construction, Industrial, etc.).
4.  **Emergency Dispatcher**: Automated hazard prediction and mitigation recommendation system.
5.  **Exposure Tracker**: Real-time calculation of hazardous AQI duration per ward.

## 🧠 AI Model: Source Fingerprinting
The system uses Gemini 3.1 Pro to perform **Signature Matching**:
- **Construction Dust**: High PM10/PM2.5 ratio + Low CO2.
- **Traffic Emissions**: High CO2 + High PM2.5 + Peak hour correlation.
- **Waste Burning**: High PM2.5 + Citizen reports + Localized wind stagnation.

## 🛠️ Setup & Deployment
1.  **Environment Variables**: `GEMINI_API_KEY` is required.
2.  **Local Development**: `npm install` followed by `npm run dev`.
3.  **Deployment**: Containerize using Docker and deploy to Google Cloud Run or AWS.

## 📊 Demo Instructions
1.  Observe the **Emergency Alert** panel for predicted hazards.
2.  Analyze the **Source Intelligence** sidebar to see probable pollution origins.
3.  Check the **Exposure Tracker** bar chart to see health impacts across wards.
