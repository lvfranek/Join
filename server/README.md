# demo-join — MariaDB backend

Express + MariaDB REST API that the Angular app talks to when `DB_PROVIDER=mariadb`.

## Setup

1. Install MariaDB locally (or run via Docker, see below) and create a database + user.
2. Copy `../.env.example` to `../.env` (project root) and fill in the `MARIADB_*` and `JWT_SECRET` values.
3. Install backend dependencies:

   ```bash
   cd server
   npm install
   ```

4. Create the schema:

   ```bash
   npm run migrate
   ```

5. Seed an initial admin user (email: `admin@demo-join.local`, password: `DemoAdmin123456!`):

   ```bash
   npm run seed
   ```

6. Start the API:

   ```bash
   npm run dev
   ```

The API listens on `http://localhost:${SERVER_PORT}` (default `3000`) and exposes routes under `/api`.

## Docker (optional)

Quick MariaDB instance:

```bash
docker run -d --name demo-join-mariadb \
  -e MARIADB_ROOT_PASSWORD=root \
  -e MARIADB_DATABASE=demo_join \
  -e MARIADB_USER=demo_join \
  -e MARIADB_PASSWORD=changeme \
  -p 3306:3306 \
  mariadb:11

cd server && npm run migrate && npm run seed
```

## Endpoints (overview)

- `POST /api/auth/register` — `{ email, password, fullName }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me`
- `GET  /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET  /api/contacts`
- `POST /api/contacts`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`

All routes except `register`/`login` require an `Authorization: Bearer <token>` header.
