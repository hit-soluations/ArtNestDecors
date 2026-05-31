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

const app = express();
const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF allowed.'));
    }
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const SESSION_SECRET = process.env.SESSION_SECRET || 'artnest-secret-change-me';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// CSRF protection
const csrfProtection = csrf({ cookie: false });

app.use(express.static(path.join(__dirname)));

// Available services
const SERVICES = [
  { id: 'painting', name: 'Painting Services & Coatings' },
  { id: 'interior', name: 'Architectural Interior Designs' },
  { id: 'murals', name: 'Hand-Crafted Wall Art & Murals' },
  { id: 'signage', name: 'Thermoplastic & Epoxy Signs' },
  { id: 'commercial', name: 'Commercial Sign Boards' },
  { id: 'automation', name: 'Electrical Automation & Wiring' },
  { id: 'waterfeatures', name: 'Artifacts, Rocks & Waterfalls' },
  { id: 'thematic', name: 'Thematic Event Properties' }
];

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
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
        uploaded_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(username) ON DELETE CASCADE
      );
      ALTER TABLE items ADD COLUMN IF NOT EXISTS title TEXT;
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

app.get('/welcome', requireAuth, (req, res) => {
  const user = req.session.user.username;
  res.sendFile(path.join(__dirname, 'welcome.html'));
});

// API to get CSRF token
app.get('/api/csrf-token', requireAuth, csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API to get available services
app.get('/api/services', requireAuth, (req, res) => {
  res.json(SERVICES);
});

// API to upload image for a service
app.post('/api/items/upload', requireAuth, csrfProtection, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const { service, title } = req.body;
  const trimmedTitle = title ? title.trim() : '';
  if (!service || !SERVICES.find(s => s.id === service)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid service' });
  }
  if (!trimmedTitle) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Image title is required' });
  }

  try {
    // Check if service already has 10 items
    const countResult = await pool.query('SELECT COUNT(*) as count FROM items WHERE service_id = $1', [service]);
    if (parseInt(countResult.rows[0].count) >= 10) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Maximum 10 items allowed per service' });
    }

    // Insert into database
    const imagePath = `/uploads/${req.file.filename}`;
    await pool.query(
      'INSERT INTO items (service_id, title, image_path, uploaded_by) VALUES ($1, $2, $3, $4)',
      [service, trimmedTitle, imagePath, req.session.user.username]
    );

    res.json({ success: true, message: 'Image uploaded successfully', imagePath });
  } catch (err) {
    fs.unlinkSync(req.file.path);
    console.error(err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// API to get items for a service
app.get('/api/items/:service', async (req, res) => {
  const { service } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, title, image_path, created_at FROM items WHERE service_id = $1 ORDER BY created_at DESC',
      [service]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// API to delete an item
app.delete('/api/items/:id', requireAuth, csrfProtection, async (req, res) => {
  const { id } = req.params;

  try {
    const itemResult = await pool.query('SELECT image_path FROM items WHERE id = $1', [id]);
    if (itemResult.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const imagePath = path.join(__dirname, itemResult.rows[0].image_path);
    
    // Delete from database
    await pool.query('DELETE FROM items WHERE id = $1', [id]);

    // Delete physical file
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
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
