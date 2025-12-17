
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const DATA_DIR = path.join(process.cwd(), 'divvyTripData');
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/stations.json');

const stations = new Map();

async function processFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  for await (const record of parser) {
    // Process start station
    if (record.start_station_id && record.start_lat && record.start_lng) {
      if (!stations.has(record.start_station_id)) {
        stations.set(record.start_station_id, {
          id: record.start_station_id,
          name: record.start_station_name,
          lat: parseFloat(record.start_lat),
          lng: parseFloat(record.start_lng),
          count: 1
        });
      } else {
        const station = stations.get(record.start_station_id);
        station.count++;
        // Average out lat/lng slightly to improve accuracy over time? 
        // Or just keep first. Keeping first is faster and usually sufficient for docking stations.
        // Actually, let's just keep the first one found to avoid drift or issues with floating point math.
      }
    }


    // Process end station
    if (record.end_station_id && record.end_lat && record.end_lng) {
      if (!stations.has(record.end_station_id)) {
        stations.set(record.end_station_id, {
          id: record.end_station_id,
          name: record.end_station_name,
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
