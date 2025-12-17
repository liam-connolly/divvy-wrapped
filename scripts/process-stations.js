
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const DATA_DIR = path.join(process.cwd(), 'divvyTripData');
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/stations.json');


const stations = new Map();
const nameToId = new Map(); // Name -> Canonical ID

async function processFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  for await (const record of parser) {
    // Process start station
    if (record.start_station_id && record.start_lat && record.start_lng && record.start_station_name) {
      const name = record.start_station_name.trim();
      const rawId = record.start_station_id;

      if (!nameToId.has(name)) {
          nameToId.set(name, rawId);
      }
      const canonicalId = nameToId.get(name);

      if (!stations.has(canonicalId)) {
        stations.set(canonicalId, {
          id: canonicalId,
          name: name,
          lat: parseFloat(record.start_lat),
          lng: parseFloat(record.start_lng),
          count: 1
        });
      } else {
        const station = stations.get(canonicalId);
        station.count++;
      }
    }


    // Process end station
    if (record.end_station_id && record.end_lat && record.end_lng && record.end_station_name) {
      const name = record.end_station_name.trim();
      const rawId = record.end_station_id;

      if (!nameToId.has(name)) {
          nameToId.set(name, rawId);
      }
      const canonicalId = nameToId.get(name);

      if (!stations.has(canonicalId)) {
        stations.set(canonicalId, {
          id: canonicalId,
          name: name,
          lat: parseFloat(record.end_lat),
          lng: parseFloat(record.end_lng),
          count: 0 // Do not count ends, only starts
        });
      }
      // Do not increment for existing stations either
    }
  }
}

async function main() {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
    
    for (const file of files) {
      await processFile(path.join(DATA_DIR, file));
    }

    const stationsList = Array.from(stations.values());
    console.log(`Found ${stationsList.length} unique stations.`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stationsList, null, 2));
    console.log(`Wrote stations to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

main();
