// @ts-check
const fs = require('fs');
const path = require('path');

// Load .env file from project root
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found. Copy .env.example to .env and fill in your values.');
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

const supabaseUrl = env['SUPABASE_URL'];
const supabaseAnonKey = env['SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const devContent = `export const environment = {
  production: false,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
  },
};
`;

const prodContent = `export const environment = {
  production: true,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
  },
};
`;

const envDir = path.resolve(__dirname, '../src/environments');
fs.writeFileSync(path.join(envDir, 'environment.ts'), devContent);
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), prodContent);

console.log('✓ Environment files written from .env');
