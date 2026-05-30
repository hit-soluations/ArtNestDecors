const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'auth.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    passhash TEXT
  );`);

  const username = 'srujana';
  const plain = 'idlydosa';
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return console.error(err);
    if (!row) {
      const hash = bcrypt.hashSync(plain, 10);
      db.run('INSERT INTO users (username, passhash) VALUES (?, ?)', [username, hash], (e) => {
        if (e) console.error(e); else console.log('Seeded default user');
      });
    }
  });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'artnest-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// serve static files from project root
app.use(express.static(path.join(__dirname)));

app.post('/login', (req, res) => {
  const { username, passkey } = req.body;
  if (!username || !passkey) return res.status(400).send('Missing credentials');

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).send('Server error');
    if (!row) return res.status(401).send('Invalid username or passkey');

    if (bcrypt.compareSync(passkey, row.passhash)) {
      req.session.user = { id: row.id, username: row.username };
      return res.redirect('/welcome');
    } else {
      return res.status(401).send('Invalid username or passkey');
    }
  });
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
