#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure a local .env exists in repo root. If missing, try to copy .env.example
console.log(__dirname);
const repoRoot = path.join(__dirname, '..','..');
const envPath = path.join(repoRoot, '.env');
const envExamplePath = path.join(repoRoot, '.env.example');
console.log(repoRoot , envPath, envExamplePath, );
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
const { pool, IMG_CLDNAME, IMG_APIKEY, IMG_APISRT } = require('../src/db');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
  try {
    console.log('Initializing database schema...');
    await initSchema();
    console.log('Seeding initial users...');
    await seedUsers();
    console.log('✅ Initial database setup complete.');

    // Optionally migrate existing local uploads into Cloudflare Images
    const migrateFlag = (process.env.MIGRATE_UPLOADS || '').toLowerCase();
    if ((migrateFlag === '1' || migrateFlag === 'true') && IMG_CLDNAME && IMG_APIKEY) {
      console.log('Starting migration of local /uploads files to Cloudflare Images...');
      await migrateUploadsToCloudflare();
    }
  } catch (err) {
    console.error('Error during initial database setup:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();

async function migrateUploadsToCloudflare() {
  try {
    const result = await pool.query("SELECT id, image_path FROM items WHERE image_path LIKE '/uploads/%'");
    if (result.rowCount === 0) {
      console.log('No local uploads found to migrate.');
      return;
    }

    for (const row of result.rows) {
      const id = row.id;
      const localPath = path.join(process.cwd(), row.image_path);
      if (!fs.existsSync(localPath)) {
        console.warn(`File missing for item ${id}: ${localPath}`);
        continue;
      }

      const buffer = fs.readFileSync(localPath);
      const filename = path.basename(localPath);
      const mimetype = 'application/octet-stream';
      try {
        const uploaded = await uploadToCloudflare(buffer, filename, mimetype);
        const imageId = uploaded.id || null;
        let imageUrl = uploaded.url || null;
        if (!imageUrl && imageId && IMG_APISRT) {
          imageUrl = `https://imagedelivery.net/${IMG_APISRT}/${imageId}/public`;
        }
        await pool.query('UPDATE items SET image_path = $1, image_id = $2 WHERE id = $3', [imageUrl || row.image_path, imageId, id]);
        console.log(`Migrated item ${id} -> ${imageUrl || imageId}`);
      } catch (e) {
        console.error(`Failed to upload item ${id}:`, e.message || e);
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

function uploadToCloudflare(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const boundary = '--------------------------' + Date.now().toString(16);
    const crlf = '\r\n';
    const partHeaders = `--${boundary}${crlf}Content-Disposition: form-data; name="file"; filename="${filename}"${crlf}Content-Type: ${mimetype}${crlf}${crlf}`;
    const end = `${crlf}--${boundary}--${crlf}`;
    const body = Buffer.concat([Buffer.from(partHeaders, 'utf8'), buffer, Buffer.from(end, 'utf8')]);

    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${IMG_CLDNAME}/images/v1`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${IMG_APIKEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.success && parsed.result) {
            const id = parsed.result.id;
            const url = (parsed.result.variants && parsed.result.variants[0]) || parsed.result.uploadURL || null;
            resolve({ id, url, raw: parsed });
          } else {
            reject(new Error('Cloudflare upload failed: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}
