import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://gmgnblddnboqdrpoqjtf.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  'sb_publishable_t5idvcMvbeNsY7QocFjp0A_v65V6svz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
