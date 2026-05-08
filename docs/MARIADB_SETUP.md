# MariaDB Setup für demo-join

Die App unterstützt zwei Datenbank-Provider, gesteuert über `DB_PROVIDER` in der `.env`:

- `supabase` (Standard, BaaS)
- `mariadb` (eigene MariaDB + Express-Backend in `server/`)

> **Wichtig:** Eine Browser-App kann nicht direkt mit MariaDB sprechen.
> Beim Provider `mariadb` läuft daher zusätzlich ein kleines Node/Express-Backend
> in [server/](../server/README.md), das per REST + JWT die Datenbank abbildet.

---

## 🚀 Schnellstart (lokal, ohne Docker)

### 1. MariaDB installieren & Datenbank anlegen

```sql
CREATE DATABASE demo_join CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'demo_join'@'localhost' IDENTIFIED BY 'changeme';
GRANT ALL PRIVILEGES ON demo_join.* TO 'demo_join'@'localhost';
FLUSH PRIVILEGES;
```

### 2. `.env` befüllen

`.env` im Projekt-Root (basierend auf `.env.example`):

```env
DB_PROVIDER=mariadb
API_URL=http://localhost:3000/api

MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=demo_join
MARIADB_PASSWORD=changeme
MARIADB_DATABASE=demo_join

JWT_SECRET=ein-langer-zufalls-string
SERVER_PORT=3000
CORS_ORIGIN=http://localhost:4200
```

### 3. Backend installieren, migrieren & seeden

```bash
cd server
npm install
npm run migrate   # erstellt Tabellen
npm run seed      # legt admin@demo-join.local / DemoAdmin123456! an
npm run dev       # API läuft auf http://localhost:3000
```

### 4. Angular-App starten

```bash
npm start
```

`scripts/set-env.js` schreibt automatisch `provider`/`apiUrl` in `src/environments/environment.ts`.

---

## 🐳 Schnellstart mit Docker

```bash
docker run -d --name demo-join-mariadb \
  -e MARIADB_ROOT_PASSWORD=root \
  -e MARIADB_DATABASE=demo_join \
  -e MARIADB_USER=demo_join \
  -e MARIADB_PASSWORD=changeme \
  -p 3306:3306 mariadb:11

cd server && npm install && npm run migrate && npm run seed && npm run dev
```

---

## 📊 Schema

Siehe `scripts/01-setup-database.mariadb.sql`. Tabellen: `users`, `tasks`, `contacts`.

Unterschiede zum Supabase-Schema:
- `users.id` ist `BIGINT AUTO_INCREMENT` statt UUID
- `users.password_hash` (bcrypt) statt Auth-Verlinkung
- Row-Level-Security wird applikationsseitig im Express-Backend (`req.user.sub`) erzwungen

---

## 🔄 Provider wechseln

Einfach in `.env`:

```env
DB_PROVIDER=supabase   # oder: mariadb
```

Danach `npm start` neu starten — `set-env.js` aktualisiert die Angular-Environment-Datei automatisch.

> **TODO (nächster Schritt):** Die Angular-Services (`task.service.ts`,
> `contact.service.ts`, `auth.service.ts`) lesen aktuell direkt von Supabase.
> Sie können einen `if (environment.provider === 'mariadb')`-Pfad bekommen, der
> stattdessen `HttpClient` gegen `environment.apiUrl` verwendet.
