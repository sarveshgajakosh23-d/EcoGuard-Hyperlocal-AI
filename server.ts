import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import db from "./database.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/sensors", (req, res) => {
    const sensors = db.prepare('SELECT * FROM sensors').all();
    res.json(sensors);
  });

  app.get("/api/readings/latest", (req, res) => {
    const readings = db.prepare(`
      SELECT r.*, s.ward_name 
      FROM readings r 
      JOIN sensors s ON r.sensor_id = s.id 
      WHERE r.id IN (SELECT MAX(id) FROM readings GROUP BY sensor_id)
    `).all();
    res.json(readings);
  });

  app.post("/api/readings", (req, res) => {
    const { sensor_id, pm25, pm10, co2, temp, humidity } = req.body;
    const insert = db.prepare(`
      INSERT INTO readings (sensor_id, pm25, pm10, co2, temp, humidity) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(sensor_id, pm25, pm10, co2, temp, humidity);
    res.status(201).json({ status: "success" });
  });

  app.get("/api/reports", (req, res) => {
    const reports = db.prepare('SELECT * FROM citizen_reports ORDER BY timestamp DESC').all();
    res.json(reports);
  });

  app.post("/api/reports", (req, res) => {
    const { lat, lng, description, severity } = req.body;
    const insert = db.prepare('INSERT INTO citizen_reports (lat, lng, description, severity) VALUES (?, ?, ?, ?)');
    insert.run(lat, lng, description, severity);
    res.status(201).json({ status: "success" });
  });

  app.get("/api/exposure", (req, res) => {
    const exposure = db.prepare(`
      SELECT s.ward_name as ward, COUNT(*) * 10 as hazardousDurationMinutes
      FROM readings r
      JOIN sensors s ON r.sensor_id = s.id
      WHERE r.pm25 > 150 AND r.timestamp >= date('now', 'start of day')
      GROUP BY s.id
    `).all();
    res.json(exposure);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Simulate data ingestion every 10 seconds
    setInterval(() => {
      const sensors = db.prepare('SELECT id FROM sensors').all() as { id: string }[];
      sensors.forEach(s => {
        // Simulate different signatures for source detection
        const base = Math.random();
        let pm25, pm10, co2;
        
        if (base > 0.8) { // Construction Signature (High PM10)
          pm25 = 80 + Math.random() * 40;
          pm10 = pm25 * 2.5 + Math.random() * 20;
          co2 = 420 + Math.random() * 30;
        } else if (base > 0.6) { // Traffic Signature (High CO2)
          pm25 = 40 + Math.random() * 30;
          pm10 = pm25 * 1.2 + Math.random() * 10;
          co2 = 600 + Math.random() * 200;
        } else { // Normal
          pm25 = 10 + Math.random() * 40;
          pm10 = pm25 * 1.3 + Math.random() * 10;
          co2 = 400 + Math.random() * 50;
        }

        const temp = 20 + Math.random() * 10;
        const humidity = 40 + Math.random() * 30;
        const wind_speed = 2 + Math.random() * 15;
        const wind_direction = Math.random() * 360;
        
        db.prepare(`
          INSERT INTO readings (sensor_id, pm25, pm10, co2, temp, humidity, wind_speed, wind_direction) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(s.id, pm25, pm10, co2, temp, humidity, wind_speed, wind_direction);
      });
    }, 10000);
  });
}

startServer();
