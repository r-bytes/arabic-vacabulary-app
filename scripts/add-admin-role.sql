-- Add admin role support to users table
-- Run this after migrate-users.sql

-- 1. Add role column to users table (default 'user')
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE, so check first
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'role';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) DEFAULT ''user''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Update existing users to have 'user' role if NULL
UPDATE users SET role = 'user' WHERE role IS NULL;

-- 3. Make first user (or specific user) admin (optional - adjust email as needed)
-- Uncomment and modify the email below to make a specific user admin:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';

-- 4. Add index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. Verify
SELECT id, email, name, role FROM users;

