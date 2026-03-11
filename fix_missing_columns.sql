-- Adicionar colunas faltantes à tabela de criativos
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS recording_direction text;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS editing_direction text;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS material_base text;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS generated_scripts jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS objective text;

-- Comentários para documentação
COMMENT ON COLUMN public.creatives.generated_scripts IS 'Histórico de roteiros gerados pela IA para este criativo';
COMMENT ON COLUMN public.creatives.objective IS 'Objetivo do criativo: captação, conversão, perpétuo, app ou google';
