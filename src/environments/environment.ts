export const environment = {
  production: false,
  provider: 'supabase' as 'supabase' | 'mariadb',
  apiUrl: 'http://localhost:3000/api',
  supabase: {
    url: 'https://YOUR-PROJECT.supabase.co',
    anonKey: 'YOUR-ANON-KEY',
  },
};
