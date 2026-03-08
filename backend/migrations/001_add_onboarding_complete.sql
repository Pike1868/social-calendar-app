-- Migration: Add onboarding_complete column to users table
-- Run this on existing databases to add onboarding support

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
