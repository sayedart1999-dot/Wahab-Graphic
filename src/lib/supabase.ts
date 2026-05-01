import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uhpwuyjucvdtauhdftee.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHd1eWp1Y3ZkdGF1aGRmdGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTUyODgsImV4cCI6MjA5MzE5MTI4OH0.4HECN1zHTYxs4lt_5C6oN8S1itJ0ZZ_IQklFJj3hhBA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
