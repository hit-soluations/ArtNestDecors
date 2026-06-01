#!/usr/bin/env node

const { seedUsers } = require('../src/seeder');
const { pool } = require('../src/db');

async function run() {
  try {
    await seedUsers();
    console.log('✅ User seeding complete.');
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
