-- Add example_sentence columns to cards table
-- Run this to add example sentence support with translations
-- 
-- Note: If you get an error that a column already exists, that's fine - just ignore it.
-- If you get "Access denied for information_schema", use the manual version below.

-- Method 1: Try to add the columns (will fail if they already exist, which is OK)
ALTER TABLE cards ADD COLUMN example_sentence TEXT NULL;
ALTER TABLE cards ADD COLUMN example_sentence_nl TEXT NULL;
ALTER TABLE cards ADD COLUMN example_sentence_en TEXT NULL;

-- If any of the above fails with "Duplicate column name", that column already exists - that's fine!
-- If you need to check if it worked, run:
-- DESCRIBE cards;
-- And look for 'example_sentence', 'example_sentence_nl', 'example_sentence_en' in the output

