-- Manual script to add example_sentence columns
-- Use this if you get "Access denied for information_schema" errors

-- Step 1: Try to add example_sentence column (if it doesn't exist)
-- If you get "Duplicate column name 'example_sentence'", the column already exists - skip this line
ALTER TABLE cards ADD COLUMN example_sentence TEXT NULL;

-- Step 2: Try to add example_sentence_nl column (if it doesn't exist)
-- If you get "Duplicate column name", the column already exists - skip this line
ALTER TABLE cards ADD COLUMN example_sentence_nl TEXT NULL;

-- Step 3: Try to add example_sentence_en column (if it doesn't exist)
-- If you get "Duplicate column name", the column already exists - skip this line
ALTER TABLE cards ADD COLUMN example_sentence_en TEXT NULL;

-- Step 4: Verify the columns were added (optional)
-- Run this to see all columns in the cards table:
DESCRIBE cards;

-- You should see 'example_sentence', 'example_sentence_nl', and 'example_sentence_en' in the list

-- Step 5: If you want to generate example sentences for existing cards,
-- you can use the API endpoint: POST /api/cards/generate-examples
-- Or update them manually in the app

