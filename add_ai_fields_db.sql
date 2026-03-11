-- Adicionar colunas para Contexto IA e Histórico de Roteiros
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS material_base text DEFAULT '';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS generated_scripts jsonb DEFAULT '[]'::jsonb;
