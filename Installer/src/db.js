const { Pool } = require('pg');
const { DATABASE_URL, IMG_CLDNAME, IMG_APIKEY, IMG_APISRT } = require('./config');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = {
  pool,
  IMG_CLDNAME,
  IMG_APIKEY,
  IMG_APISRT
};
