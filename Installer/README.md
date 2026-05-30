# ArtNest Decors - Database Installer

This folder contains scripts for initial database setup on Render PostgreSQL.

## Database Schema

The database includes the following tables:

### `users` Table
Stores admin user credentials for authentication.
- `id` - Primary key
- `username` - Unique username
- `passhash` - Bcrypt-hashed password
- `created_at` - Timestamp of account creation

### `items` Table
Stores portfolio images and metadata for each service.
- `id` - Primary key
- `service_id` - Service identifier (e.g., 'painting', 'interior', etc.)
- `image_path` - Path to the uploaded image
- `uploaded_by` - Username of the admin who uploaded
- `created_at` - Timestamp of upload

**Constraint:** Maximum 5 items per service

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

## Security Features

### Authentication & Sessions
- bcrypt password hashing with 10 salt rounds
- Secure HTTP-only cookies with SameSite=strict
- Server-side session management
- CSRF token protection on all state-changing requests

### File Upload Security
- Image file type validation (JPG, PNG, WebP, GIF only)
- 5MB file size limit per image
- Uploaded files stored outside web root
- Secure file naming with random tokens

### Data Limits
- Maximum 5 portfolio items per service
- Services enforced via dropdown selection from server-side list

## Available Services

1. Painting Services & Coatings
2. Architectural Interior Designs
3. Hand-Crafted Wall Art & Murals
4. Thermoplastic & Epoxy Signs
5. Commercial Sign Boards
6. Electrical Automation & Wiring
7. Artifacts, Rocks & Waterfalls
8. Thematic Event Properties

## Files

- `schema.sql` - Database schema (tables, indexes)
- `seed.js` - Node.js seeder script for initial users
- `README.md` - This file

## Admin Dashboard Features

After login, admins access the dashboard at `/welcome` with two tabs:

### Add Item Tab
- Upload images for a selected service
- Drag-and-drop support
- Real-time image preview
- Automatic validation (file type, size)
- Service limit enforcement (max 5 items)

### Remove Item Tab
- View all items for a service
- Delete items with confirmation
- Physical file cleanup on delete

## Notes

- Setup scripts are run once during initial deployment
- The main server (`server.js`) validates login credentials against existing users
- File uploads are stored in the `/uploads` directory (created automatically)
- CSRF tokens are required for all POST/DELETE requests for security
- Session cookies expire after 24 hours
- All database operations are performed by authenticated users only
