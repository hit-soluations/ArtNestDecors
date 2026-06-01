#!/usr/bin/env node

const { initSchema } = require('../src/schema');
const { pool } = require('../src/db');

async function run() {
  try {
    await initSchema();
    console.log('✅ Database schema created or verified successfully.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
