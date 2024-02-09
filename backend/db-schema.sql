DROP TABLE IF EXISTS calendar_acl;
DROP TABLE IF EXISTS users_calendars;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS calendars;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE CHECK (position('@' IN email) > 1),
    google_id TEXT,
    birthday DATE,
    time_zone TEXT,
    account_created TIMESTAMP,
    last_login TIMESTAMP
);
CREATE TABLE calendars (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(36),
    summary TEXT,
    location TEXT,
    time_zone TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    google_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE events (
    id VARCHAR(100) PRIMARY KEY,
    calendar_id VARCHAR(100),
    summary TEXT,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    visibility TEXT,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    color_id TEXT,
    time_zone TEXT,
    google_id TEXT,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id)
);
CREATE TABLE user_calendars (
    user_id VARCHAR(36),
    calendar_id VARCHAR(100),
    PRIMARY KEY (user_id, calendar_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (calendar_id) REFERENCES calendars(id)
);
CREATE TABLE calendar_acl (
    id SERIAL PRIMARY KEY,
    calendar_id VARCHAR(100),
    user_id VARCHAR(36),
    access_role TEXT,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);