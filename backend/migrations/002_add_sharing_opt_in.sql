-- Add sharing_opt_in column to users table
-- Users must opt in before friends can see their free/busy availability
ALTER TABLE users ADD COLUMN sharing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
