
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'database/divvy.db');

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Get all stations (for initial map load if we switched away from JSON)
// But we are keeping JSON for base map for speed. This is for reference.
app.get('/api/stations', (req, res) => {
    db.all("SELECT * FROM stations", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get flows for a specific station
app.get('/api/station/:id/flows', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            f.count,
            s.id as end_station_id,
            s.name as end_station_name,
            s.lat as end_lat,
            s.lng as end_lng
        FROM flows f
        JOIN stations s ON f.end_station_id = s.id
        WHERE f.start_station_id = ?

        ORDER BY f.count DESC
        LIMIT 5000
    `;
    
    db.all(sql, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
