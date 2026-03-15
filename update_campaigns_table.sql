-- Adicionar colunas para a Feature de Análise de Resultados
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_analysis boolean DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN public.campaigns.metadata IS 'Payload da análise (resumo da IA, dados de gráficos e planilha)';
COMMENT ON COLUMN public.campaigns.is_analysis IS 'Flag para identificar se o card é uma análise de resultados de anúncios';
