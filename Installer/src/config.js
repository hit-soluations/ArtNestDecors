const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const IMG_CLDNAME = process.env.IMG_CLDNAME || null;
const IMG_APIKEY = process.env.IMG_APIKEY || null;
const IMG_APISRT = process.env.IMG_APISRT || null;

if (!DATABASE_URL) {
  throw new Error('Error: DATABASE_URL environment variable is required. Copy .env.example to .env and update it.');
}

module.exports = {
  DATABASE_URL,
  IMG_CLDNAME,
  IMG_APIKEY,
  IMG_APISRT
};
