# Demo-Join Database Setup

## 🚀 Schnellstart

### Schritt 1: Datenbank-Schema erstellen

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. Gehe zu **SQL Editor** → **New Query**
4. Kopiere den Inhalt von `scripts/01-setup-database.sql`
5. Klicke **Run**

✅ Tabellen und Row-Level-Security sind jetzt aktiv!

### Schritt 2: Admin-User seeden

Der Admin-User wird über Node.js erstellt (mit Service-Key Auto-Auth).

#### 2a. Service Key besorgen

1. Gehe zu **Project Settings** → **API**
2. Kopiere den **Service Role Key** (NICHT den anon key!)
3. Öffne `.env` und füge hinzu:
   ```
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ```

#### 2b. Script ausführen

```bash
node scripts/seed-admin.js
```

**Output bei Erfolg:**
```
✓ Admin user created: admin@demo-join.local
✓ Admin record inserted
✓ Sample tasks created
✅ Seeding complete!

Login credentials:
  Email:    admin@demo-join.local
  Password: DemoAdmin123456!
```

### Schritt 3: Testen

1. Starte die App:
   ```bash
   npm start
   ```

2. Gehe zu `http://localhost:4200/login`

3. Melde dich an mit:
   - Email: `admin@demo-join.local`
   - Password: `DemoAdmin123456!`

4. Du solltest zum Dashboard (`/summary`) weitergeleitet werden

5. Auf `/board` siehst du die Sample-Tasks im Kanban-Board

---

## 📊 Datenbank-Struktur

### `users`
- `id` - UUID (links zu `auth.users`)
- `email` - unique email
- `full_name` - Display name
- `role` - 'admin' | 'user'
- `created_at`, `updated_at`

### `tasks`
- `id` - UUID
- `title`, `description`
- `status` - 'todo' | 'in-progress' | 'done'
- `priority` - 'low' | 'medium' | 'high'
- `assigned_to` - UUID (user)
- `created_by` - UUID (user)
- Timestamps

### `contacts`
- `id` - UUID
- `first_name`, `last_name`, `email`, `phone`
- `message` - Message text
- `created_by` - UUID (user)
- `created_at`

---

## 🔐 Row-Level-Security (RLS)

Alle Tabellen haben RLS aktiviert:
- **Users**: Können nur ihre eigenen Daten sehen/ändern
- **Tasks**: Sehen nur Tasks die ihnen zugewiesen sind oder die sie erstellt haben
- **Contacts**: Sehen nur Contacts die sie selbst erstellt haben

---

## ❓ Troubleshooting

### "Service Key not found"
→ Prüfe ob `SUPABASE_SERVICE_KEY` in `.env` eingetragen ist

### "Cannot find module '@supabase/supabase-js'"
→ Installiere: `npm install --save-dev @supabase/supabase-js`

### "Error: User already exists"
→ Der User existiert schon. Lösche ihn im Dashboard oder ändere die Email im Script

### "Database connection refused"
→ Prüfe ob `SUPABASE_URL` korrekt in `.env` ist

---

## 📝 Weitere User manuell anlegen

Im Dashboard:
1. **Authentication** → **Users**
2. **Add user** → Email + Password
3. Dann update `users` Tabelle mit der neuen user ID
