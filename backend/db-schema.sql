-- Drop existing tables and triggers if they exist
DROP TRIGGER IF EXISTS update_calendars_update_time ON calendars CASCADE;
DROP TRIGGER IF EXISTS update_events_update_time ON events CASCADE;
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
    time_zone TEXT,
    account_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
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
<<<<<<< HEAD
=======
    owner_id VARCHAR(36),
>>>>>>> add-calendars-model
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
<<<<<<< HEAD
    FOREIGN KEY (user_id) REFERENCES users(id)
=======
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
>>>>>>> add-calendars-model
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