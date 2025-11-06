-- Verification script to check if the migration was successful
-- Run this after migrate-users.sql to verify everything is correct

-- 1. Check if users table exists and has the system user
SELECT 
  'Users table check' as check_name,
  COUNT(*) as system_user_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM users 
WHERE id = 'system';

-- 2. Check if user_id columns exist
SELECT 
  'Folders user_id column' as check_name,
  COUNT(*) as column_exists,
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'folders' 
  AND COLUMN_NAME = 'user_id';

SELECT 
  'Cards user_id column' as check_name,
  COUNT(*) as column_exists,
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'cards' 
  AND COLUMN_NAME = 'user_id';

-- 3. Check for NULL user_id values (should be 0)
SELECT 
  'Folders with NULL user_id' as check_name,
  COUNT(*) as null_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ HAS NULL VALUES' END as status
FROM folders 
WHERE user_id IS NULL;

SELECT 
  'Cards with NULL user_id' as check_name,
  COUNT(*) as null_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ HAS NULL VALUES' END as status
FROM cards 
WHERE user_id IS NULL;

-- 4. Check for foreign key constraints
SELECT 
  'Folders foreign key' as check_name,
  CONSTRAINT_NAME,
  CASE WHEN CONSTRAINT_NAME IS NOT NULL THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'folders' 
  AND COLUMN_NAME = 'user_id' 
  AND REFERENCED_TABLE_NAME = 'users'
LIMIT 1;

SELECT 
  'Cards foreign key' as check_name,
  CONSTRAINT_NAME,
  CASE WHEN CONSTRAINT_NAME IS NOT NULL THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'cards' 
  AND COLUMN_NAME = 'user_id' 
  AND REFERENCED_TABLE_NAME = 'users'
LIMIT 1;

-- 5. Check data distribution by user
SELECT 
  'Data distribution' as check_name,
  user_id,
  COUNT(*) as folder_count
FROM folders
GROUP BY user_id;

SELECT 
  'Data distribution' as check_name,
  user_id,
  COUNT(*) as card_count
FROM cards
GROUP BY user_id;

-- 6. Check for orphaned data (user_id that doesn't exist in users table)
SELECT 
  'Orphaned folders' as check_name,
  COUNT(*) as orphaned_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ HAS ORPHANED DATA' END as status
FROM folders f
LEFT JOIN users u ON f.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
WHERE u.id IS NULL;

SELECT 
  'Orphaned cards' as check_name,
  COUNT(*) as orphaned_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ HAS ORPHANED DATA' END as status
FROM cards c
LEFT JOIN users u ON c.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
WHERE u.id IS NULL;

-- 7. Check collation consistency
SELECT 
  'Collation check' as check_name,
  TABLE_NAME,
  COLUMN_NAME,
  COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('id', 'user_id')
  AND TABLE_NAME IN ('users', 'folders', 'cards')
ORDER BY TABLE_NAME, COLUMN_NAME;

