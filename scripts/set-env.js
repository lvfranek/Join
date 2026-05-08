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

const provider = (env['DB_PROVIDER'] || 'supabase').toLowerCase();
if (provider !== 'supabase' && provider !== 'mariadb') {
  console.error(`ERROR: DB_PROVIDER must be "supabase" or "mariadb", got "${provider}"`);
  process.exit(1);
}

const apiUrl = env['API_URL'] || 'http://localhost:3000/api';
const supabaseUrl = env['SUPABASE_URL'] || '';
const supabaseAnonKey = env['SUPABASE_ANON_KEY'] || '';

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

console.log(`✓ Environment files written from .env (provider=${provider})`);
