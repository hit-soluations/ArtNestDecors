# ArtNest Decors - Database Installer

This folder contains scripts for initial database setup on Render PostgreSQL.

## Setup Steps

### 1. Create the Schema

Execute `schema.sql` on your PostgreSQL database using your preferred client (pgAdmin, psql, DBeaver, etc.):

```sql
-- Copy and execute the entire contents of schema.sql
```

Or via CLI:
```bash
psql postgresql://artnestdecors_db_user:dJ7IYCyKctx6OaktoZPyjpEDgBDhayKo@dpg-d8de8if7f7vs73c4qn60-a.ohio-postgres.render.com/artnestdecors_db < schema.sql
```

### 2. Seed Initial Users

Run the Node.js seeder script:

```bash
cd /workspaces/ArtNestDecors
DATABASE_URL="postgresql://artnestdecors_db_user:dJ7IYCyKctx6OaktoZPyjpEDgBDhayKo@dpg-d8de8if7f7vs73c4qn60-a.ohio-postgres.render.com/artnestdecors_db" node Installer/seed.js
```

This creates two users:
- **srujana** / **idly@dosa**
- **akram** / **idly@dosa**

## Files

- `schema.sql` - Database schema (tables, indexes)
- `seed.js` - Node.js seeder script for initial users
- `README.md` - This file

## Notes

- These scripts are run once during initial setup
- The main server (`server.js`) does NOT create or seed data; it only validates login credentials against existing users
- Passwords are hashed using bcrypt with 10 salt rounds
