-- Fix collation mismatch between user_id columns and users.id
-- This script ensures all user_id columns have the same collation as users.id

-- 1. Check current collations
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('id', 'user_id')
  AND TABLE_NAME IN ('users', 'folders', 'cards')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 2. Fix folders.user_id collation to match users.id
-- First, find the collation of users.id
SET @user_id_collation = (
  SELECT COLLATION_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'id'
);

-- If users.id doesn't have a collation, default to utf8mb4_unicode_ci
SET @user_id_collation = IFNULL(@user_id_collation, 'utf8mb4_unicode_ci');

-- Update folders.user_id
SET @sql = CONCAT('ALTER TABLE folders MODIFY COLUMN user_id VARCHAR(255) COLLATE ', @user_id_collation, ' NOT NULL');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update cards.user_id
SET @sql = CONCAT('ALTER TABLE cards MODIFY COLUMN user_id VARCHAR(255) COLLATE ', @user_id_collation, ' NOT NULL');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Verify collations are now matching
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('id', 'user_id')
  AND TABLE_NAME IN ('users', 'folders', 'cards')
ORDER BY TABLE_NAME, COLUMN_NAME;

