const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const schemaPath = path.join(__dirname, '..', 'schema.sql');

async function initSchema() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  return pool.query(schema);
}

module.exports = {
  initSchema
};
