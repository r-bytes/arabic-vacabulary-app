-- Manual migration script - Run these commands one by one if the automated script fails
-- This is a simpler version that you can execute step by step

-- Step 1: Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NULL,
  emailVerified TIMESTAMP NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 2: Create system user for existing data
INSERT IGNORE INTO users (id, email, name) VALUES ('system', 'system@lisan.app', 'System User');

-- Step 3: Check if user_id columns exist, if not add them
-- Run this and check the result:
SELECT COUNT(*) as column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'folders' 
  AND COLUMN_NAME = 'user_id';

-- If column_exists is 0, run:
-- ALTER TABLE folders ADD COLUMN user_id VARCHAR(255);

-- Same for cards:
SELECT COUNT(*) as column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'cards' 
  AND COLUMN_NAME = 'user_id';

-- If column_exists is 0, run:
-- ALTER TABLE cards ADD COLUMN user_id VARCHAR(255);

-- Step 4: Set all NULL user_id values to 'system'
UPDATE folders SET user_id = 'system' WHERE user_id IS NULL;
UPDATE cards SET user_id = 'system' WHERE user_id IS NULL;

-- Step 5: Check for existing foreign keys and drop them if they exist
-- First, find the constraint name:
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'folders' 
  AND COLUMN_NAME = 'user_id' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- If a constraint exists, drop it (replace 'constraint_name' with the actual name):
-- ALTER TABLE folders DROP FOREIGN KEY constraint_name;

-- Same for cards:
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'cards' 
  AND COLUMN_NAME = 'user_id' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- If a constraint exists, drop it:
-- ALTER TABLE cards DROP FOREIGN KEY constraint_name;

-- Step 6: Make user_id NOT NULL
ALTER TABLE folders MODIFY COLUMN user_id VARCHAR(255) NOT NULL;
ALTER TABLE cards MODIFY COLUMN user_id VARCHAR(255) NOT NULL;

-- Step 7: Add foreign keys
ALTER TABLE folders ADD CONSTRAINT fk_folders_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE cards ADD CONSTRAINT fk_cards_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 8: Add indexes
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_folder_user ON cards(folder_id, user_id);

-- Step 9: Verify the migration
SELECT 
  (SELECT COUNT(*) FROM folders WHERE user_id IS NULL) as folders_without_user,
  (SELECT COUNT(*) FROM cards WHERE user_id IS NULL) as cards_without_user,
  (SELECT COUNT(*) FROM users WHERE id = 'system') as system_user_exists;

-- Both should be 0, and system_user_exists should be 1

