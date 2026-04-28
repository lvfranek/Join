// @ts-check
/**
 * Seed-Script für Demo-Admin User
 *
 * WICHTIG: Du brauchst den SERVICE_KEY (Service Role Key) von Supabase!
 * Füge diesen zu .env hinzu:
 *   SUPABASE_SERVICE_KEY=your-service-role-key
 *
 * Besorge den Key:
 * 1. Gehe zu Supabase Dashboard → Project Settings
 * 2. API → Service Role Key (kopieren)
 * 3. In .env eintragen
 * 4. Dann: node scripts/seed-admin.js
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env not found');
  process.exit(1);
}

const lines = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  env[key.trim()] = rest.join('=').trim();
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = env['SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_KEY'];

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in .env');
  console.error('   Add it from: Supabase Dashboard → Settings → API → Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...\n');

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@demo-join.local',
      password: 'DemoAdmin123456!',
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    const adminId = data.user.id;
    console.log('✓ Admin user created:', data.user.email);

    // Insert into users table
    const { error: insertError } = await supabase.from('users').insert({
      id: adminId,
      email: 'admin@demo-join.local',
      full_name: 'Demo Admin',
      role: 'admin',
    });

    if (insertError) {
      console.error('❌ Error inserting user record:', insertError.message);
      process.exit(1);
    }

    console.log('✓ Admin record inserted\n');

    // Create sample tasks
    const { error: tasksError } = await supabase.from('tasks').insert([
      {
        title: 'Setup authentication',
        description: 'Configure user authentication system',
        status: 'done',
        priority: 'high',
        assigned_to: adminId,
        created_by: adminId,
      },
      {
        title: 'Create task management UI',
        description: 'Build the kanban board interface',
        status: 'in-progress',
        priority: 'high',
        assigned_to: adminId,
        created_by: adminId,
      },
      {
        title: 'Add contact form',
        description: 'Implement contact form with validation',
        status: 'todo',
        priority: 'medium',
        assigned_to: adminId,
        created_by: adminId,
      },
    ]);

    if (tasksError) {
      console.error('❌ Error creating tasks:', tasksError.message);
      process.exit(1);
    }

    console.log('✓ Sample tasks created\n');
    console.log('✅ Seeding complete!\n');
    console.log('Login credentials:');
    console.log('  Email:    admin@demo-join.local');
    console.log('  Password: DemoAdmin123456!');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

seedAdmin();
