require('dotenv').config();

const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const SESSION_SECRET = process.env.SESSION_SECRET || 'artnest-secret-change-me';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname)));

app.post('/login', async (req, res) => {
  const { username, passkey } = req.body;
  if (!username || !passkey) return res.status(400).send('Missing credentials');

  try {
    const result = await pool.query('SELECT id, username, passhash FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) return res.status(401).send('Invalid username or passkey');

    const user = result.rows[0];
    if (!bcrypt.compareSync(passkey, user.passhash)) {
      return res.status(401).send('Invalid username or passkey');
    }

    req.session.user = { id: user.id, username: user.username };
    return res.redirect('/welcome');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

app.get('/welcome', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  const user = req.session.user.username;
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Welcome</title><link rel="stylesheet" href="/css/style.css"></head><body><div style="max-width:800px;margin:80px auto;text-align:center;"><h1>Welcome, ${user}</h1><p>Server page returns: success admin login.</p><p><a href="/logout">Logout</a></p></div></body></html>`);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/index.html');
  });
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
