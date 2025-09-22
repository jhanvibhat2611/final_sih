/*
  # Create core tables for water quality monitoring system

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `project_id` (text, unique identifier)
      - `name` (text, project name)
      - `description` (text, project description)
      - `district` (text, district location)
      - `city` (text, city/state location)
      - `latitude` (text, latitude coordinate)
      - `longitude` (text, longitude coordinate)
      - `created_at` (timestamp)
    
    - `samples`
      - `id` (uuid, primary key)
      - `project_id` (text, references projects)
      - `sample_id` (text, unique sample identifier)
      - `metal` (text, metal type)
      - `si` (numeric, concentration value)
      - `ii` (numeric, permissible value)
      - `mi` (numeric, relative weight)
      - `latitude` (text, sample location latitude)
      - `longitude` (text, sample location longitude)
      - `district` (text, district)
      - `city` (text, city)
      - `date` (date, collection date)
      - `created_at` (timestamp)
    
    - `alerts`
      - `id` (uuid, primary key)
      - `project_id` (text, references projects)
      - `sample_id` (text, references samples)
      - `message` (text, alert message)
      - `severity` (text, alert severity level)
      - `acknowledged` (boolean, acknowledgment status)
      - `created_at` (timestamp)
    
    - `policies`
      - `id` (uuid, primary key)
      - `name` (text, policy name)
      - `metal` (text, metal type)
      - `threshold` (numeric, threshold value)
      - `created_by` (text, creator email)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  district text NOT NULL,
  city text NOT NULL,
  latitude text,
  longitude text,
  created_at timestamptz DEFAULT now()
);

-- Create samples table
CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  sample_id text NOT NULL,
  metal text,
  si numeric,
  ii numeric,
  mi numeric,
  latitude text,
  longitude text,
  district text,
  city text,
  date date,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  sample_id text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  metal text NOT NULL,
  threshold numeric NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access on projects"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on projects"
  ON projects FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access on samples"
  ON samples FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on samples"
  ON samples FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access on alerts"
  ON alerts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on alerts"
  ON alerts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on alerts"
  ON alerts FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public read access on policies"
  ON policies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on policies"
  ON policies FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert sample data
INSERT INTO projects (project_id, name, description, district, city, latitude, longitude) VALUES
('p1', 'Ganga Water Quality Study - Varanasi', 'Comprehensive study of heavy metal pollution levels in Ganga river water samples at various locations in Varanasi.', 'Varanasi', 'Uttar Pradesh', '25.3176', '82.9739'),
('p2', 'Yamuna Water Quality Study - Delhi', 'Monitoring water quality and HMPI levels in Yamuna river across multiple sampling points in Delhi.', 'New Delhi', 'Delhi', '28.7041', '77.1025'),
('p3', 'Cauvery Water Quality Study - Karnataka', 'Analysis of heavy metal contamination in Cauvery river samples near Karnataka industrial areas.', 'Mysuru', 'Karnataka', '12.2958', '76.6394'),
('p4', 'Narmada Water Quality Assessment - Gujarat', 'Environmental assessment of Narmada river water quality focusing on industrial pollution impacts.', 'Bharuch', 'Gujarat', '21.7051', '72.9960'),
('p5', 'Godavari River Monitoring - Maharashtra', 'Long-term monitoring project for Godavari river water quality and ecosystem health.', 'Nashik', 'Maharashtra', '19.9975', '73.7898');

INSERT INTO samples (project_id, sample_id, metal, si, ii, mi, latitude, longitude, district, city, date) VALUES
('p1', 'GNG-001', 'Lead', 0.09, 0.3, 0.7, '25.3176', '82.9739', 'Varanasi', 'Uttar Pradesh', '2025-01-12'),
('p2', 'YMN-004', 'Arsenic', 0.05, 0.2, 0.5, '28.7041', '77.1025', 'New Delhi', 'Delhi', '2025-02-07'),
('p3', 'CVR-007', 'Chromium', 0.03, 0.1, 0.4, '12.2958', '76.6394', 'Mysuru', 'Karnataka', '2025-03-05'),
('p1', 'GNG-002', 'Mercury', 0.012, 0.25, 0.6, '25.2677', '82.9890', 'Varanasi', 'Uttar Pradesh', '2025-01-15'),
('p2', 'YMN-005', 'Cadmium', 0.008, 0.15, 0.45, '28.6519', '77.2315', 'New Delhi', 'Delhi', '2025-02-10'),
('p4', 'NRM-001', 'Lead', 0.15, 0.4, 0.8, '21.7051', '72.9960', 'Bharuch', 'Gujarat', '2025-01-28'),
('p5', 'GDV-003', 'Arsenic', 0.035, 0.18, 0.52, '19.9975', '73.7898', 'Nashik', 'Maharashtra', '2025-02-18');

INSERT INTO alerts (project_id, sample_id, message, severity) VALUES
('p1', 'GNG-001', 'Lead levels (0.09 mg/L) exceeded WHO safe limits (0.01 mg/L) in Ganga water sample GNG-001.', 'high'),
('p2', 'YMN-004', 'Arsenic levels (0.05 mg/L) equal to BBI threshold in Yamuna water sample YMN-004.', 'medium'),
('p1', 'GNG-002', 'Mercury levels (0.012 mg/L) significantly exceeded WHO safe limits (0.006 mg/L) in sample GNG-002.', 'high'),
('p4', 'NRM-001', 'Lead contamination (0.15 mg/L) at critical levels in Narmada sample NRM-001.', 'high');

INSERT INTO policies (name, metal, threshold, created_by) VALUES
('Lead Contamination Policy', 'Lead', 0.02, 'policy@aquasure.com'),
('Arsenic Safety Standard', 'Arsenic', 0.015, 'policy@aquasure.com'),
('Mercury Control Regulation', 'Mercury', 0.008, 'policy@aquasure.com');