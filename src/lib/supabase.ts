import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Inicialização do cliente do Supabase para o lado do Front-end (Browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
