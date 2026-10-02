-- BKK Flood Watch - Database Schema (PostgreSQL + PostGIS)
-- ใช้เป็นมาตรฐานตั้งต้นสำหรับ production

CREATE EXTENSION IF NOT EXISTS postgis;

-- เขต
CREATE TABLE districts (
  district_id   VARCHAR(10) PRIMARY KEY,
  district_name_th TEXT NOT NULL,
  district_name_en TEXT,
  geometry      GEOMETRY(MultiPolygon, 4326)
);

CREATE INDEX idx_districts_geom ON districts USING GIST (geometry);

-- สถานีตรวจวัด
CREATE TABLE stations (
  station_id    VARCHAR(32) PRIMARY KEY,
  station_type  VARCHAR(20) NOT NULL CHECK (station_type IN ('road','canal','rainfall','tunnel')),
  station_name  TEXT NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  district_id   VARCHAR(10) REFERENCES districts(district_id),
  source_system VARCHAR(50),
  active_status BOOLEAN DEFAULT true,
  geom          GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED
);

CREATE INDEX idx_stations_geom ON stations USING GIST (geom);
CREATE INDEX idx_stations_district ON stations(district_id);

-- ระดับน้ำ (Time-series)
CREATE TABLE water_measurements (
  measurement_id  BIGSERIAL PRIMARY KEY,
  station_id      VARCHAR(32) REFERENCES stations(station_id),
  measured_at     TIMESTAMPTZ NOT NULL,
  water_level_cm  NUMERIC(8,2),
  canal_level_m   NUMERIC(8,3),
  flow_rate       NUMERIC(10,2),
  status          VARCHAR(20) CHECK (status IN ('normal','watch','flood','critical','unknown')),
  source_timestamp TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_water_station_time ON water_measurements(station_id, measured_at DESC);

-- ฝน
CREATE TABLE rainfall_measurements (
  rainfall_id     BIGSERIAL PRIMARY KEY,
  station_id      VARCHAR(32) REFERENCES stations(station_id),
  measured_at     TIMESTAMPTZ NOT NULL,
  rainfall_mm     NUMERIC(8,2),
  accumulation_1h NUMERIC(8,2),
  accumulation_3h NUMERIC(8,2),
  accumulation_24h NUMERIC(8,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rain_station_time ON rainfall_measurements(station_id, measured_at DESC);

-- กล้อง CCTV
CREATE TABLE cctv_cameras (
  camera_id     VARCHAR(32) PRIMARY KEY,
  camera_name   TEXT NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  district_id   VARCHAR(10) REFERENCES districts(district_id),
  stream_url    TEXT,
  snapshot_url  TEXT,
  last_online_at TIMESTAMPTZ,
  camera_status VARCHAR(20) DEFAULT 'unknown'
);

-- พยากรณ์
CREATE TABLE flood_forecasts (
  forecast_id         BIGSERIAL PRIMARY KEY,
  district_id         VARCHAR(10) REFERENCES districts(district_id),
  forecast_date       DATE NOT NULL,
  predicted_rainfall  TEXT,
  flood_risk_level    VARCHAR(20),
  confidence_level    VARCHAR(10),
  model_version       VARCHAR(32),
  generated_at        TIMESTAMPTZ DEFAULT NOW(),
  advice              TEXT
);

CREATE UNIQUE INDEX idx_forecast_district_date ON flood_forecasts(district_id, forecast_date);

-- Audit Log
CREATE TABLE system_logs (
  log_id          BIGSERIAL PRIMARY KEY,
  source          VARCHAR(100),
  action          VARCHAR(100) NOT NULL,
  response_status INTEGER,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_started ON system_logs(started_at DESC);
