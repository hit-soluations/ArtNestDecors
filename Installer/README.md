# ArtNest Decors - Database Installer

This folder now follows a modular installer architecture with a clean CLI facade and reusable database modules.

## Installer Architecture

- `src/` contains reusable application logic
  - `config.js` loads environment values
  - `db.js` creates and exports the PostgreSQL connection pool
  - `schema.js` applies the database schema from `schema.sql`
  - `seeder.js` seeds application users safely
- `scripts/` contains executable CLI entrypoints
  - `scripts/init-db.js` initializes the database schema
  - `scripts/seed-users.js` inserts the initial admin users
- `schema.sql` defines the database tables and indexes
- `package.json` defines installer-specific commands and dependencies

## What this installer provides

### Database schema
- `users` table for admin credentials
- `items` table for uploaded portfolio images
- indexes for `username`, `service_id`, and `uploaded_by`

### Seeder
- creates safe admin accounts if they do not already exist
- uses bcrypt password hashing

## Usage

1. Copy the root `.env.example` to `.env` and set your connection string:

```bash
cp .env.example .env
```

2. Update `.env` with your local database credentials.

3. Install dependencies from the root or inside the `Installer` folder:

```bash
npm install
```

4. Run the full initial database setup in one step:

```bash
node Installer/setup.js
```

If you want to run the steps separately instead:

```bash
node Installer/scripts/init-db.js
node Installer/scripts/seed-users.js
```

## Optional CLI shorthand

If you prefer the installer package entrypoints:

```bash
cd Installer
npm install
npm run setup-db
```

## Files

- `schema.sql` - base database schema
- `src/` - implementation modules
- `scripts/` - CLI entrypoints
- `package.json` - installer package definition
- `README.md` - this file

## Notes

- Sensitive values must stay in `.env` and should never be checked into Git.
- The installer is now designed for reuse, testing, and production deployment.
 
Important: this repository should never contain live secrets. Keep only ` .env.example` in version control and create a local `Installer/.env` (ignored by git) when running installer scripts.
