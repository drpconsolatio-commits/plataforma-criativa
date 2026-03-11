import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing insert...");
  const campId = crypto.randomUUID();
  const { data, error } = await supabase.from('campaigns').insert({
    id: campId,
    title: 'Teste Node 2',
    date: '10 Mar',
    column_id: 'inspiracoes',
    pinned: false,
    checklist_roteirizacao: false,
    checklist_edicao: false,
    labels: []
  }).select();
  
  if (error) {
    console.error('\n--> Test Error campaigns:', error);
  } else {
    console.log('\n--> Test Success campaigns:', data);
  }
  
  const { data: creatData, error: creatError } = await supabase.from('creatives').insert({
     campaign_id: campId,
     name: "Criativo Teste",
     hook_type: "Visual",
     marketing_angle: "",
     format: "Talkinghead",
     cta_type: "Suave",
     status: "pending",
     channels: [],
     sub_channels: [],
     drive_link: "",
     uploaded_to_channels: false,
     reference: "",
     notes: "",
     recording_direction: "",
     editing_direction: ""
  }).select();

  if (creatError) {
    console.error('\n--> Test Error creatives:', creatError);
  } else {
    console.log('\n--> Test Success creatives:', creatData);
  }
}
test();
