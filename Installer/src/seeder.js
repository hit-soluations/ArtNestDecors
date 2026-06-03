const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const users = [
  { username: 'srujana', password: 'idly1@dosa' },
  { username: 'akram', password: 'idly1@dosa' },
  { username: 'admin', password: 'idly1@dosa' }
];

async function seedUsers() {
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
}

module.exports = {
  seedUsers
};
