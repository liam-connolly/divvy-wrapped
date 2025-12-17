
CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT,
    lat REAL,
    lng REAL
);

CREATE TABLE IF NOT EXISTS flows (
    start_station_id TEXT,
    end_station_id TEXT,
    count INTEGER,
    PRIMARY KEY (start_station_id, end_station_id),
    FOREIGN KEY(start_station_id) REFERENCES stations(id),
    FOREIGN KEY(end_station_id) REFERENCES stations(id)
);

CREATE INDEX IF NOT EXISTS idx_flows_start ON flows(start_station_id);
