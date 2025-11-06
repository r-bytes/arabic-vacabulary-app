-- Add example_sentence translation columns (nl and en)
-- Run this to add the translation columns for example sentences
-- 
-- Note: If you get an error that a column already exists, that's fine - just ignore it.

-- Add example_sentence_nl column (Dutch translation)
ALTER TABLE cards ADD COLUMN example_sentence_nl TEXT NULL;

-- Add example_sentence_en column (English translation)
ALTER TABLE cards ADD COLUMN example_sentence_en TEXT NULL;

-- If you get "Duplicate column name" errors, those columns already exist - that's fine!
-- If you need to check if it worked, run:
-- DESCRIBE cards;
-- And look for 'example_sentence_nl' and 'example_sentence_en' in the output

