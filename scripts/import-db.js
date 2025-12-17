
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

async function processFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  for await (const record of parser) {
    const { start_station_id, end_station_id, start_lat, start_lng, start_station_name, end_station_name, end_lat, end_lng } = record;

    if (!start_station_id || !end_station_id || !start_lat || !end_lat) continue;

    // Collect stations
    if (!stations.has(start_station_id)) {
        stations.set(start_station_id, { id: start_station_id, name: start_station_name, lat: start_lat, lng: start_lng });
    }
    if (!stations.has(end_station_id)) {
        stations.set(end_station_id, { id: end_station_id, name: end_station_name, lat: end_lat, lng: end_lng });
    }

    // Aggregate flows
    const flowKey = `${start_station_id}|${end_station_id}`;
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
            const stmtFlow = db.prepare("INSERT OR REPLACE INTO flows (start_station_id, end_station_id, count) VALUES (?, ?, ?)");
            for (const [key, count] of flows.entries()) {
                const [startId, endId] = key.split('|');
                stmtFlow.run(startId, endId, count);
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
