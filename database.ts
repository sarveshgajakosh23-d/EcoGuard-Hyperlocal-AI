import Database from 'better-sqlite3';

const db = new Database('pollution.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sensors (
    id TEXT PRIMARY KEY,
    ward_name TEXT,
    lat REAL,
    lng REAL
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT,
    pm25 REAL,
    pm10 REAL,
    co2 REAL,
    temp REAL,
    humidity REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sensor_id) REFERENCES sensors(id)
  );

  CREATE TABLE IF NOT EXISTS citizen_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL,
    lng REAL,
    description TEXT,
    severity TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add wind columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(readings)").all() as { name: string }[];
const columnNames = tableInfo.map(c => c.name);

if (!columnNames.includes('wind_speed')) {
  db.exec("ALTER TABLE readings ADD COLUMN wind_speed REAL DEFAULT 0");
}
if (!columnNames.includes('wind_direction')) {
  db.exec("ALTER TABLE readings ADD COLUMN wind_direction REAL DEFAULT 0");
}

// Seed initial sensors if empty
const sensorCount = db.prepare('SELECT count(*) as count FROM sensors').get() as { count: number };
if (sensorCount.count === 0) {
  const insert = db.prepare('INSERT INTO sensors (id, ward_name, lat, lng) VALUES (?, ?, ?, ?)');
  insert.run('S001', 'Downtown Central', 40.7128, -74.0060);
  insert.run('S002', 'Industrial Zone A', 40.7306, -73.9352);
  insert.run('S003', 'Residential North', 40.7589, -73.9851);
  insert.run('S004', 'Westside Park', 40.7829, -73.9654);
}

export default db;
