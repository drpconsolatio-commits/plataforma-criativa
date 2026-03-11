-- 1. Criar a tabela de Campanhas (Cards Principais)
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  column_id text NOT NULL,
  pinned boolean DEFAULT false,
  checklist_roteirizacao boolean DEFAULT false,
  checklist_edicao boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar a tabela de Criativos (Sub-itens da Campanha)
CREATE TABLE public.creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  hook_type text,
  marketing_angle text,
  format text,
  cta_type text,
  status text DEFAULT 'pending',
  channels text[],
  sub_channels text[],
  drive_link text,
  uploaded_to_channels boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criar a tabela de Sessões de Chat dos Agentes
CREATE TABLE public.agent_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Criar a tabela de Mensagens de Chat (Múltiplas por Sessão)
CREATE TABLE public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.agent_chats(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user' ou 'assistant'
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar a Segurança em Nível de Linha (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- 6. Criar Políticas de Acesso Público Total (Permite o nosso Anon Key ler/escrever sem login temporariamente)
CREATE POLICY "Permitir tudo em Campanhas para todos" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em Criativos para todos" ON public.creatives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em Agent Chats para todos" ON public.agent_chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo em Agent Messages para todos" ON public.agent_messages FOR ALL USING (true) WITH CHECK (true);
