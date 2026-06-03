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

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else if (IMG_CLDNAME && IMG_APIKEY && IMG_APISRT) {
  cloudinary.config({ cloud_name: IMG_CLDNAME, api_key: IMG_APIKEY, api_secret: IMG_APISRT, secure: true });
} else {
  console.warn('Cloudinary not configured; migration will be skipped if attempted.');
}

async function run() {
  try {
    // Show configuration status
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE SETUP - CONFIGURATION STATUS');
    console.log('='.repeat(60));
    console.log('\n📋 ENVIRONMENT:');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET (required)'}`);

    console.log('\n☁️  CLOUDINARY:');
    if (IMG_CLDNAME && IMG_APIKEY && IMG_APISRT) {
      console.log(`  ✅ Cloud Name: ${IMG_CLDNAME}`);
      console.log(`  ✅ API Key: Set`);
      console.log(`  ✅ API Secret: Set`);
    } else {
      console.warn(`  ❌ Cloudinary NOT configured`);
      if (!IMG_CLDNAME) console.warn(`     Missing: IMG_CLDNAME`);
      if (!IMG_APIKEY) console.warn(`     Missing: IMG_APIKEY`);
      if (!IMG_APISRT) console.warn(`     Missing: IMG_APISRT`);
    }

    console.log('\n📝 MIGRATION FLAGS:');
    console.log(`  MIGRATE_UPLOADS: ${process.env.MIGRATE_UPLOADS || 'not set'}`);
    console.log(`  MIGRATE_CF: ${process.env.MIGRATE_CF || 'not set'}`);
    console.log('='.repeat(60) + '\n');

    console.log('Initializing database schema...');
    await initSchema();
    console.log('Seeding initial users...');
    await seedUsers();
    console.log('✅ Initial database setup complete.');

    // Optionally migrate existing local uploads into Cloudflare Images
    const migrateFlag = (process.env.MIGRATE_UPLOADS || '').toLowerCase();
    if ((migrateFlag === '1' || migrateFlag === 'true') && IMG_CLDNAME && IMG_APIKEY) {
      console.log('Starting migration of local /uploads files to Cloudinary...');
      await migrateUploadsToCloudflare();
    }
    // Optionally migrate entries that reference Cloudflare/imagedelivery URLs into Cloudinary
    const migrateCF = (process.env.MIGRATE_CF || process.env.MIGRATE_UPLOADS || '').toLowerCase();
    if ((migrateCF === '1' || migrateCF === 'true') && IMG_CLDNAME && IMG_APIKEY) {
      console.log('Starting migration of Cloudflare-hosted URLs to Cloudinary...');
      await migrateCloudflareToCloudinary();
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
        if (!cloudinary.config().cloud_name) {
          console.warn('Skipping migration because Cloudinary is not configured.');
          break;
        }
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({ folder: 'artnest' }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });

          const readStream = streamifier.createReadStream(buffer);
          readStream.on('error', (err) => {
            uploadStream.destroy();
            reject(new Error('Failed to read buffer: ' + err.message));
          });

          uploadStream.on('error', (err) => {
            reject(err);
          });

          readStream.pipe(uploadStream);
        });
        const imageId = uploadResult.public_id || uploadResult.id || null;
        // Prefer common secure/url fields (Cloudinary/Cloudflare). If missing, try to construct a reasonable URL
        // using the IMG_* name (cloud name) so migrated rows still point to an accessible resource.
        const imageUrl = uploadResult.secure_url || uploadResult.url || uploadResult.uploadURL || (imageId && IMG_CLDNAME ? `https://res.cloudinary.com/${IMG_CLDNAME}/image/upload/${imageId}` : null);
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
  // Placeholder kept for compatibility but we now use Cloudinary upload streams in migrateUploadsToCloudflare
  return Promise.reject(new Error('Legacy Cloudflare upload helper is no longer supported.'));
}
