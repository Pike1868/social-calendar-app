CREATE TABLE invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    inviter_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
