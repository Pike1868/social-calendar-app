-- Drop existing tables and triggers if they exist
DROP TRIGGER IF EXISTS update_calendars_update_time ON calendars CASCADE;
DROP TRIGGER IF EXISTS update_events_update_time ON events CASCADE;
DROP TABLE IF EXISTS circle_members CASCADE;
DROP TABLE IF EXISTS circles CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS calendar_acl CASCADE;
DROP TABLE IF EXISTS users_calendars CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS calendars CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Create tables for app
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL UNIQUE CHECK (position('@' IN email) > 1),
    google_id TEXT,
    birthday DATE,
    display_name TEXT,
    home_city TEXT,
    avatar_url TEXT,
    time_zone TEXT,
    account_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    access_token TEXT,
    refresh_token TEXT
);
CREATE TABLE calendars (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title TEXT,
    location TEXT,
    time_zone TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    google_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE events (
    id VARCHAR(100) PRIMARY KEY,
    calendar_id VARCHAR(100) NOT NULL,
    owner_id VARCHAR(36),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    visibility TEXT,
    status TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    color_id TEXT,
    time_zone TEXT,
    google_id TEXT,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE
    SET NULL
);
CREATE TABLE users_calendars (
    user_id VARCHAR(36) NOT NULL,
    calendar_id VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, calendar_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id)
);
CREATE TABLE calendar_acl (
    id SERIAL PRIMARY KEY,
    calendar_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    access_role TEXT NOT NULL,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Friendships table
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    requester_id VARCHAR(36) NOT NULL,
    addressee_id VARCHAR(36) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT no_self_friend CHECK (requester_id != addressee_id),
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Circles table
CREATE TABLE circles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_circles_user ON circles(user_id);

-- Circle members table
CREATE TABLE circle_members (
    circle_id INTEGER NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (circle_id, member_id),
    FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Function to update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
-- Triggers for updating 'updated_at' columns
CREATE TRIGGER update_calendars_update_time BEFORE
UPDATE ON calendars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_update_time BEFORE
UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_update_time BEFORE
UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();