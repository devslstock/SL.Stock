-- Add tax override columns to sales_order_items table
ALTER TABLE sales_order_items
ADD COLUMN cfop text,
ADD COLUMN csosn text,
ADD COLUMN cst text,
ADD COLUMN icms_rate numeric,
ADD COLUMN pis_cst text,
ADD COLUMN pis_rate numeric,
ADD COLUMN cofins_cst text,
ADD COLUMN cofins_rate numeric,
ADD COLUMN ipi_rate numeric,
ADD COLUMN ncm text,
ADD COLUMN cest text,
ADD COLUMN origin text;
