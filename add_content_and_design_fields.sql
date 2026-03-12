-- Adicionar novos campos para suporte a conteúdos estáticos e direcionais de design
ALTER TABLE creatives 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS design_direction TEXT DEFAULT NULL;

COMMENT ON COLUMN creatives.content_type IS 'Tipo de conteúdo: Vídeo ou Estático';
COMMENT ON COLUMN creatives.design_direction IS 'Direcionais livres para criação de peças estáticas';
