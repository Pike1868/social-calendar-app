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