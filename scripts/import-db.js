
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import sqlite3 from 'sqlite3';

const DATA_DIR = path.join(process.cwd(), 'divvyTripData');
const DB_FILE = path.join(process.cwd(), 'database/divvy.db');
const SCHEMA_FILE = path.join(process.cwd(), 'database/schema.sql');

const db = new sqlite3.Database(DB_FILE);


// In-memory aggregators to minimize DB writes
const stations = new Map();
const flows = new Map(); // Key: "start_id|end_id", Value: count
const nameToId = new Map(); // Name -> Canonical ID

async function processFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  for await (const record of parser) {
    const { start_station_id, end_station_id, start_lat, start_lng, start_station_name, end_station_name, end_lat, end_lng } = record;


    if (!start_station_id || !start_lat) continue;
    if ((!end_station_id && (!end_lat || !end_lng))) continue;



    // Extract Month
    // Format: "2025-01-21 17:23:54"
    let month = 0;
    if (record.started_at) {
        const dateParts = record.started_at.split(' ')[0].split('-'); // ["2025", "01", "21"]
        if (dateParts.length > 1) {
            month = parseInt(dateParts[1], 10);
        }
    }

    // --- Deduplication Logic ---
    let finalStartId = start_station_id;
    if (start_station_name) {
        const sName = start_station_name.trim();
        if (!nameToId.has(sName)) {
            nameToId.set(sName, start_station_id);
        }
        finalStartId = nameToId.get(sName);
    }
    
    // Collect Start Station
    if (!stations.has(finalStartId)) {
        stations.set(finalStartId, { id: finalStartId, name: start_station_name, lat: start_lat, lng: start_lng });
    }

    // Handle End Station
    let finalEndId = end_station_id;
    let finalEndName = end_station_name;

    if (end_station_id && end_station_id.trim() !== '' && end_station_name) {
        const eName = end_station_name.trim();
         if (!nameToId.has(eName)) {
            nameToId.set(eName, end_station_id);
        }
        finalEndId = nameToId.get(eName);

        if (!stations.has(finalEndId)) {
            stations.set(finalEndId, { id: finalEndId, name: end_station_name, lat: end_lat, lng: end_lng });
        }
    } else {
        // Non-station ride end (Virtual Station)
        finalEndId = `LOC_${end_lat}_${end_lng}`;
        finalEndName = "Public Lock / Other";
        
        if (!stations.has(finalEndId)) {
            stations.set(finalEndId, { id: finalEndId, name: finalEndName, lat: end_lat, lng: end_lng });
        }
    }

    // Aggregate flows
    // Key: "start_id|end_id|month"
    const flowKey = `${finalStartId}|${finalEndId}|${month}`;
    flows.set(flowKey, (flows.get(flowKey) || 0) + 1);
  }
}

async function initDB() {
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    return new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function main() {
    try {
        await initDB();
        console.log("Database initialized.");

        const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
        for (const file of files) {
            await processFile(path.join(DATA_DIR, file));
        }

        console.log(`Aggregated ${stations.size} stations and ${flows.size} unique flows.`);
        console.log("Inserting into database...");

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Insert Stations
            const stmtStation = db.prepare("INSERT OR IGNORE INTO stations (id, name, lat, lng) VALUES (?, ?, ?, ?)");
            for (const s of stations.values()) {
                stmtStation.run(s.id, s.name, s.lat, s.lng);
            }
            stmtStation.finalize();

            // Insert Flows
            const stmtFlow = db.prepare("INSERT OR REPLACE INTO flows (start_station_id, end_station_id, month, count) VALUES (?, ?, ?, ?)");
            for (const [key, count] of flows.entries()) {
                const [startId, endId, monthStr] = key.split('|');
                stmtFlow.run(startId, endId, parseInt(monthStr), count);
            }
            stmtFlow.finalize();

            db.run("COMMIT", () => {
                console.log("Import complete.");
                db.close();
            });
        });

    } catch (error) {
        console.error("Error during import:", error);
    }
}

main();
