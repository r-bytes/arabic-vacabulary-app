-- Migration script to add is_favorite column to folders table
-- Run this script in your MySQL database
-- 
-- Note: If you get an error that the column already exists, that's fine - 
-- it means the migration was already run successfully.

-- Add is_favorite column to folders table (default false, NOT NULL)
-- If column already exists, you'll get an error - that's okay, just ignore it
ALTER TABLE folders 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for better query performance when filtering by favorites
-- If index already exists, you'll get an error - that's okay, just ignore it
CREATE INDEX idx_folders_is_favorite ON folders(is_favorite);

