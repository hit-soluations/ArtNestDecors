#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function verify() {
  try {
    const tables = ['users', 'items'];
    const results = {};
    for (const t of tables) {
      const res = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) as exists", [t]);
      results[t] = res.rows[0].exists;
    }

    console.log('Schema verification results:');
    for (const t of tables) console.log(`- ${t}: ${results[t] ? 'present' : 'missing'}`);

    // Check index existence for items.service_id
    const idxRes = await pool.query("SELECT to_regclass('public.idx_items_service') as idx");
    console.log(`- idx_items_service: ${idxRes.rows[0].idx ? 'present' : 'missing'}`);
  } catch (err) {
    console.error('Verification failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

verify();
