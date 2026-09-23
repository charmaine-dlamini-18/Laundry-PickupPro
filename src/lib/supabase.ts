import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
export async function testSupabaseConnection() {
  const { data, error } = await supabase.auth.getSession();

  console.log('Supabase connection:', { data, error });
}