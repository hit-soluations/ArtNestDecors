#!/usr/bin/env node

/**
 * ArtNest Decors - Database Seeder
 * Run this script to seed initial users into the PostgreSQL database
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... node seed.js
 */

require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const users = [
  { username: 'srujana', password: 'idly@dosa' },
  { username: 'akram', password: 'idly@dosa' }
];

async function seedUsers() {
  try {
    for (const user of users) {
      const { rowCount } = await pool.query('SELECT 1 FROM users WHERE username = $1', [user.username]);
      if (rowCount === 0) {
        const hash = bcrypt.hashSync(user.password, 10);
        await pool.query('INSERT INTO users (username, passhash) VALUES ($1, $2)', [user.username, hash]);
        console.log(`✓ Seeded user: ${user.username}`);
      } else {
        console.log(`⊘ User already exists: ${user.username}`);
      }
    }
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedUsers();
