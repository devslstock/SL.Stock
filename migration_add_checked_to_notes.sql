-- Adicionar coluna 'checked' para marcar recados como concluídos
ALTER TABLE public.system_notes ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT false;

-- Atualizar recados anteriores para falso
UPDATE public.system_notes SET checked = false WHERE checked IS NULL;
