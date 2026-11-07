import { SupabaseYahooStore } from './store.ts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required for cleanup.');
await new SupabaseYahooStore(url, key).cleanup(new Date().toISOString());
