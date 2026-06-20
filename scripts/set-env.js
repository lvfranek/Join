// @ts-check
const fs = require('fs');
const path = require('path');

// Load .env file from project root (local dev only)
const envPath = path.resolve(__dirname, '../.env');
const env = {};

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
  console.log('✓ Loaded environment from .env file');
} else {
  console.log('No .env file found — reading from process.env (Vercel / CI)');
}

// Merge process.env so Vercel environment variables take precedence
const get = (key) => env[key] ?? process.env[key] ?? '';

const provider = (get('DB_PROVIDER') || 'supabase').toLowerCase();
if (provider !== 'supabase' && provider !== 'mariadb') {
  console.error(`ERROR: DB_PROVIDER must be "supabase" or "mariadb", got "${provider}"`);
  process.exit(1);
}

const apiUrl = get('API_URL') || 'http://localhost:3000/api';
const supabaseUrl = get('SUPABASE_URL');
const supabaseAnonKey = get('SUPABASE_ANON_KEY');

if (provider === 'supabase' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set when DB_PROVIDER=supabase');
  process.exit(1);
}

const buildContent = (production) => `export const environment = {
  production: ${production},
  provider: '${provider}' as 'supabase' | 'mariadb',
  apiUrl: '${apiUrl}',
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
  },
};
`;

const envDir = path.resolve(__dirname, '../src/environments');
fs.writeFileSync(path.join(envDir, 'environment.ts'), buildContent(false));
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), buildContent(true));

console.log(`✓ Environment files written (provider=${provider})`);