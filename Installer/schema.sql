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
