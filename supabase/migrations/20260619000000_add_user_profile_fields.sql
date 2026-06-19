-- Add avatar_url and phone to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS phone text;
