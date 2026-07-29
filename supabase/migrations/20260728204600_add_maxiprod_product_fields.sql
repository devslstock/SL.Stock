ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ipi_rate numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fci text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gtin text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gtin_tributable text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS complementary_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS technical_notes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
