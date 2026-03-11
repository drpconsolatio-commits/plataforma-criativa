-- Adicionar coluna 'labels' na tabela campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS labels jsonb DEFAULT '[]'::jsonb;

-- Adicionar colunas adicionais na tabela creatives
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS reference text DEFAULT '';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS recording_direction text DEFAULT '';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS editing_direction text DEFAULT '';
