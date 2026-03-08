-- Migration 003: Add privacy controls (US-017)

ALTER TABLE users ADD COLUMN sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE sharing_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_availability BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_sharing_preferences_user ON sharing_preferences(user_id);
