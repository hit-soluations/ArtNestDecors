require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const csrf = require('csurf');
const cors = require('cors');
const https = require('https');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
// This stops Express from automatically serving index.html
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Now this route will trigger successfully
app.get('/', (req, res) => {
    // You can process custom logic here before sending the file
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['http://localhost:8080', 'https://artnestdecors.onrender.com'];
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    // Allow same-origin and custom domains by passing through; adjust if needed.
    return callback(null, true);
  },
  credentials: true
}));

// Required when running behind Render/Nginx proxies
app.set('trust proxy', true);

const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Configure multer to use memory storage (no local uploads directory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF allowed.'));
    }
  }
});

// Cloudinary configuration using the original IMG_* env var names so existing deploys don't need to change env
const IMG_CLDNAME = process.env.IMG_CLDNAME; // will be used as Cloudinary cloud_name
const IMG_APIKEY = process.env.IMG_APIKEY; // will be used as Cloudinary api_key
const IMG_APISRT = process.env.IMG_APISRT; // will be used as Cloudinary api_secret

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else if (IMG_CLDNAME && IMG_APIKEY && IMG_APISRT) {
  cloudinary.config({ cloud_name: IMG_CLDNAME, api_key: IMG_APIKEY, api_secret: IMG_APISRT, secure: true });
} else {
  console.error('Warning: Cloudinary credentials (IMG_CLDNAME, IMG_APIKEY, IMG_APISRT) are not all set. Uploads will fail.');
}

function uploadToCloudinary(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    console.log(`[UPLOAD_STREAM] Starting stream for ${filename} (${buffer.length} bytes, ${mimetype})`);

    const uploadStream = cloudinary.uploader.upload_stream({ folder: 'artnest' }, (error, result) => {
      if (error) {
        console.error(`[UPLOAD_STREAM] Cloudinary callback error:`, error);
        return reject(error);
      }
      console.log(`[UPLOAD_STREAM] Cloudinary callback success - public_id=${result.public_id}`);
      resolve({ id: result.public_id, url: result.secure_url, raw: result });
    });

    const readStream = streamifier.createReadStream(buffer);

    readStream.on('error', (err) => {
      console.error(`[UPLOAD_STREAM] ReadStream error:`, err.message);
      uploadStream.destroy();
      reject(new Error('Failed to read buffer: ' + err.message));
    });

    uploadStream.on('error', (err) => {
      console.error(`[UPLOAD_STREAM] UploadStream error:`, err.message);
      reject(err);
    });

    console.log(`[UPLOAD_STREAM] Beginning pipe from readStream to uploadStream`);
    readStream.pipe(uploadStream);
  });
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const SESSION_SECRET = process.env.SESSION_SECRET || 'artnest-secret-change-me';


app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Use 'none' in production when behind different origin (and secure required),
    // but 'lax' locally so browsers accept the cookie on localhost over HTTP.
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));


// CSRF protection
const csrfProtection = csrf({ cookie: false });

app.get('/welcome.html', (req, res) => {
  res.redirect('/welcome');
});



// Available services
const SERVICES = [
  { id: 'painting', name: 'Painting Services & Coatings' },
  { id: 'interior', name: 'Architectural Interior Designs' },
  { id: 'murals', name: 'Hand-Crafted Wall Art & Murals' },
  { id: 'signage', name: 'Thermoplastic & Epoxy Signs' },
  { id: 'commercial', name: 'Commercial Sign Boards' },
  { id: 'automation', name: 'Electrical Automation & Wiring' },
  { id: 'waterfeatures', name: 'Artificial Rocks Waterfalls' },
  { id: 'thematic', name: 'Thematic Event Properties' }
];

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.accepts('html')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
};

// Initialize database schema for users and items
async function ensureDatabaseSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passhash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        service_id TEXT NOT NULL,
        title TEXT,
        image_path TEXT NOT NULL,
        image_id TEXT,
        uploaded_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(username) ON DELETE CASCADE
      );
      ALTER TABLE items ADD COLUMN IF NOT EXISTS title TEXT;
      ALTER TABLE items ADD COLUMN IF NOT EXISTS image_id TEXT;
      CREATE INDEX IF NOT EXISTS idx_items_service ON items(service_id);
      CREATE INDEX IF NOT EXISTS idx_items_uploaded_by ON items(uploaded_by);
    `);
  } catch (err) {
    console.error('Error creating database schema:', err);
  }
}

ensureDatabaseSchema();

app.post('/login', async (req, res) => {
  const { username, passkey } = req.body;
  if (!username || !passkey) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const result = await pool.query('SELECT id, username, passhash FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid username or passkey' });

    const user = result.rows[0];
    if (!bcrypt.compareSync(passkey, user.passhash)) {
      return res.status(401).json({ error: 'Invalid username or passkey' });
    }

      req.session.regenerate(err => {
          if (err) {
              console.error(err);
              return res.status(500).json({
                  error: 'Session error'
              });
          }

          req.session.user = {
              id: user.id,
              username: user.username
          };

          req.session.save(err => {
              if (err) {
                  console.error(err);
                  return res.status(500).json({
                      error: 'Session save failed'
                  });
              }

              return res.json({
                  success: true,
                  username: user.username
              });
          });
      });
} catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/check', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            authenticated: false
        });
    }

    res.json({
        authenticated: true,
        user: req.session.user
    });
});

// Serve welcome page with injected CSRF token to avoid an extra token fetch
app.get('/welcome', requireAuth, csrfProtection, (req, res) => {
  fs.readFile(path.join(__dirname, 'welcome.html'), 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read welcome.html:', err);
      return res.status(500).send('Server error');
    }
    const token = req.csrfToken();
    const injected = data.replace('</head>', `<script>window.__CSRF_TOKEN = ${JSON.stringify(token)}; window.__IMG_CLDNAME = ${JSON.stringify(IMG_CLDNAME || null)};</script></head>`);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Vary', 'Cookie');
    res.send(injected);
  });
});

// API to get CSRF token
app.get('/api/csrf-token', requireAuth, csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API to get available services
app.get('/api/services', requireAuth, (req, res) => {
  res.json(SERVICES);
});

// API to upload image for a service (uploads to Cloudinary)
app.post('/api/items/upload', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const { service, title } = req.body;
  const trimmedTitle = title ? title.trim() : '';
  if (!service || !SERVICES.find(s => s.id === service)) {
    return res.status(400).json({ error: 'Invalid service' });
  }
  if (!trimmedTitle) {
    return res.status(400).json({ error: 'Image title is required' });
  }

  try {
    console.log(`[UPLOAD] Starting upload for service=${service}, title=${trimmedTitle}, fileSize=${req.file.size}, bufferLength=${req.file.buffer.length}`);

    // Check if service already has 10 items
    const countResult = await pool.query('SELECT COUNT(*) as count FROM items WHERE service_id = $1', [service]);
    if (parseInt(countResult.rows[0].count) >= 10) {
      return res.status(400).json({ error: 'Maximum 10 items allowed per service' });
    }

    // Upload to Cloudinary using IMG_* env vars mapped above
    if (!cloudinary.config().cloud_name) {
      console.error('[UPLOAD] Cloudinary not configured - cloud_name missing');
      return res.status(500).json({ error: 'Cloudinary not configured on server' });
    }

    console.log(`[UPLOAD] Uploading to Cloudinary with cloud_name=${cloudinary.config().cloud_name}`);
    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname || `upload-${Date.now()}.jpg`, req.file.mimetype || 'application/octet-stream');
    console.log(`[UPLOAD] Cloudinary upload successful - publicId=${uploadResult.id}, url=${uploadResult.url}`);

    const publicId = uploadResult.id || null;
    const imageUrl = uploadResult.url || '';

    // Insert into database (image_path stores URL, image_id stores public_id)
    await pool.query(
      'INSERT INTO items (service_id, title, image_path, image_id, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
      [service, trimmedTitle, imageUrl, publicId, req.session.user.username]
    );

    console.log(`[UPLOAD] Database insert successful - publicId=${publicId}`);
    res.json({ success: true, message: 'Image uploaded successfully', imagePath: imageUrl });
  } catch (err) {
    console.error('[UPLOAD] Error during upload:', err.message || err);
    console.error('[UPLOAD] Full error:', err);
    res.status(500).json({ error: 'Failed to upload image: ' + (err.message || 'Unknown error') });
  }
});

// API to get items for a service
app.get('/api/items/:service', async (req, res) => {
  const { service } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, title, image_path, image_id, created_at FROM items WHERE service_id = $1 ORDER BY created_at DESC',
      [service]
    );

    // Normalize image paths sent to the client:
    // - If image_path is an absolute URL (starts with http) or already points to Cloudflare, leave as-is.
    // - If image_path is a site-relative path (e.g. /uploads/...), convert to an absolute URL using the request host so the browser can load it.
    const normalized = result.rows.map(row => {
      const out = { ...row };
      if (out.image_path && typeof out.image_path === 'string') {
        const p = out.image_path.trim();
        if (p.startsWith('/')) {
          // convert to absolute URL for browser consumption
          out.image_path = `${req.protocol}://${req.get('host')}${p}`;
        }
      }
      return out;
    });

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// API to delete an item (removes from DB and Cloudflare Images)
app.delete('/api/items/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const itemResult = await pool.query('SELECT image_path, image_id FROM items WHERE id = $1', [id]);
    if (itemResult.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const imageId = itemResult.rows[0].image_id;

    // Delete from database
    await pool.query('DELETE FROM items WHERE id = $1', [id]);

    // Delete from Cloudinary if we have a public id and Cloudinary credentials are available.
    // Prefer explicit IMG_* env var names used in this project (IMG_CLDNAME, IMG_APIKEY, IMG_APISRT),
    // or fall back to CLOUDINARY_URL if present.
    if (imageId && (process.env.CLOUDINARY_URL || (IMG_CLDNAME && IMG_APIKEY && IMG_APISRT))) {
      try {
        // Use Cloudinary uploader.destroy to remove the image by its public id.
        await cloudinary.uploader.destroy(imageId, { resource_type: 'image' });
      } catch (e) {
        console.error('Failed to delete image from Cloudinary:', e);
      }
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/index.html');
  });
});

// Global error handler for cleaner JSON responses on upload and CSRF failures
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File is too large. Maximum size is 10MB.' });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}`);

  // Production diagnostic info
  console.log(`\n📋 CONFIGURATION STATUS:`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set (defaults to development)'}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET'}`);
  console.log(`  SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅ Set' : '❌ Using default'}`);

  // Cloudinary configuration check
  console.log(`\n☁️  CLOUDINARY STATUS:`);
  const cloudinaryConfig = cloudinary.config();
  if (cloudinaryConfig.cloud_name) {
    console.log(`  ✅ Cloud Name: ${cloudinaryConfig.cloud_name}`);
    console.log(`  ✅ API Key: ${cloudinaryConfig.api_key ? 'Set' : 'NOT SET'}`);
    console.log(`  ✅ API Secret: ${cloudinaryConfig.api_secret ? 'Set' : 'NOT SET'}`);
  } else {
    console.error(`  ❌ Cloudinary NOT configured`);
    console.error(`     Check environment variables:`);
    console.error(`     - CLOUDINARY_URL or`);
    console.error(`     - IMG_CLDNAME, IMG_APIKEY, IMG_APISRT`);
    console.warn(`     ⚠️  Image uploads will FAIL without Cloudinary config`);
  }

  console.log(`${'='.repeat(60)}\n`);
});
