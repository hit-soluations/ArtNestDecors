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

const app = express();

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

// Cloudflare Images configuration - expects the following env vars to be set:
// IMG_CLDNAME (Cloudflare account id), IMG_APIKEY (API token)
const CF_ACCOUNT_ID = process.env.IMG_CLDNAME;
const CF_API_TOKEN = process.env.IMG_APIKEY;
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Error: IMG_CLDNAME and IMG_APIKEY environment variables are required for Cloudflare Images uploads.');
  // Do not exit here to allow other non-upload functionality, but uploads will fail if not set.
}

// Helper to upload a Buffer to Cloudflare Images
async function uploadToCloudflare(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const boundary = '--------------------------' + Date.now().toString(16);
    const crlf = '\r\n';
    const partHeaders = `--${boundary}${crlf}Content-Disposition: form-data; name="file"; filename="${filename}"${crlf}Content-Type: ${mimetype}${crlf}${crlf}`;
    const end = `${crlf}--${boundary}--${crlf}`;
    const body = Buffer.concat([Buffer.from(partHeaders, 'utf8'), buffer, Buffer.from(end, 'utf8')]);

    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
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

app.use(express.static(path.join(__dirname)));

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

    req.session.user = { id: user.id, username: user.username };
    return res.json({ success: true, username: user.username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Serve welcome page with injected CSRF token to avoid an extra token fetch
app.get('/welcome', requireAuth, csrfProtection, (req, res) => {
  fs.readFile(path.join(__dirname, 'welcome.html'), 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read welcome.html:', err);
      return res.status(500).send('Server error');
    }
    const token = req.csrfToken();
    const injected = data.replace('</head>', `<script>window.__CSRF_TOKEN = ${JSON.stringify(token)}; window.__CF_ACCOUNT_ID = ${JSON.stringify(CF_ACCOUNT_ID || null)};</script></head>`);
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

// API to upload image for a service (uploads to Cloudflare Images)
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
    // Check if service already has 10 items
    const countResult = await pool.query('SELECT COUNT(*) as count FROM items WHERE service_id = $1', [service]);
    if (parseInt(countResult.rows[0].count) >= 10) {
      return res.status(400).json({ error: 'Maximum 10 items allowed per service' });
    }

    // Upload to Cloudflare Images
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return res.status(500).json({ error: 'Cloudflare Images not configured on server' });
    }

    const uploadResult = await uploadToCloudflare(req.file.buffer, req.file.originalname || `upload-${Date.now()}.jpg`, req.file.mimetype || 'application/octet-stream');
    const imageUrl = uploadResult.url || '';
    const imageId = uploadResult.id || null;

    // Insert into database
    await pool.query(
      'INSERT INTO items (service_id, title, image_path, image_id, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
      [service, trimmedTitle, imageUrl, imageId, req.session.user.username]
    );

    res.json({ success: true, message: 'Image uploaded successfully', imagePath: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload image' });
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

    // Delete from Cloudflare Images if we have an image id
    if (imageId && CF_ACCOUNT_ID && CF_API_TOKEN) {
      try {
        await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.cloudflare.com',
            path: `/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${imageId}`,
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${CF_API_TOKEN}`
            }
          };
          const reqCf = https.request(options, (resCf) => {
            let data = '';
            resCf.on('data', (chunk) => data += chunk);
            resCf.on('end', () => resolve());
          });
          reqCf.on('error', (e) => reject(e));
          reqCf.end();
        });
      } catch (e) {
        console.error('Failed to delete image from Cloudflare:', e);
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
    return res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' });
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

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
