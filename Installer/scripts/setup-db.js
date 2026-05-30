#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure a local .env exists in repo root. If missing, try to copy .env.example
const repoRoot = path.join(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
const envExamplePath = path.join(repoRoot, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.error('Created .env from .env.example. Please edit .env and set DATABASE_URL before re-running this script.');
  } else {
    console.error('Missing .env and .env.example. Create a .env with DATABASE_URL before running the setup.');
  }
  process.exit(1);
}

// At this point .env exists; require the modules that will load it
const { initSchema } = require('../src/schema');
const { seedUsers } = require('../src/seeder');
const { pool } = require('../src/db');

async function run() {
  try {
    console.log('Initializing database schema...');
    await initSchema();
    console.log('Seeding initial users...');
    await seedUsers();
    console.log('✅ Initial database setup complete.');
  } catch (err) {
    console.error('Error during initial database setup:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
