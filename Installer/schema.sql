-- ArtNest Decors - Initial Database Setup
-- Execute this script on the PostgreSQL database to create the required schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passhash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on username for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Items table for storing portfolio images
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  service_id TEXT NOT NULL,
	title TEXT,
  image_path TEXT NOT NULL,
  image_id TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(username) ON DELETE CASCADE
);

-- Create an index on service_id for faster queries
CREATE INDEX IF NOT EXISTS idx_items_service ON items(service_id);
CREATE INDEX IF NOT EXISTS idx_items_uploaded_by ON items(uploaded_by);
