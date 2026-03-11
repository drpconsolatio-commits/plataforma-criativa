import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('campaigns').insert({
    title: 'Teste Node',
    date: '10 Mar',
    column_id: 'inspiracoes'
  }).select();
  
  if (error) {
    console.error('Test Error:', error);
  } else {
    console.log('Test Success:', data);
  }
}
test();
