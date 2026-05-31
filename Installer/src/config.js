const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Error: DATABASE_URL environment variable is required. Copy .env.example to .env and update it.');
}

module.exports = {
  DATABASE_URL
};
