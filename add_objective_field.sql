-- Adicionar o campo objective à tabela de criativos
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS objective text;

-- Comentário para documentação
COMMENT ON COLUMN public.creatives.objective IS 'Objetivo do criativo: captação, conversão, perpétuo, app ou google';
