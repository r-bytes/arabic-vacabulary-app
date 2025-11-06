-- Migration script to add multi-user support
-- Run this script in your MySQL database

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NULL, -- For credentials login (hashed with bcrypt)
  emailVerified TIMESTAMP NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create accounts table for OAuth providers (used by NextAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INT,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_account (provider, provider_account_id)
);

-- 3. Create sessions table (used by NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create verification tokens table (used by NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 5. Add user_id columns to existing tables
ALTER TABLE folders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 6. Create default user for existing data (optional migration step)
-- This creates a "system" user for any existing data
INSERT IGNORE INTO users (id, email, name) VALUES ('system', 'system@lisan.app', 'System User');

-- 7. Migrate existing data to system user
UPDATE folders SET user_id = 'system' WHERE user_id IS NULL;
UPDATE cards SET user_id = 'system' WHERE user_id IS NULL;

-- 8. Add foreign keys (optional, but recommended)
ALTER TABLE folders ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE cards ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 9. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_folder_user ON cards(folder_id, user_id);

