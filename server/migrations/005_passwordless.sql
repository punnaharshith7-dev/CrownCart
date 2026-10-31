-- One-time sign-in codes sent by email or SMS. Only a hash of the code is stored.
CREATE TABLE login_codes (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  target     TEXT NOT NULL,
  code_hash  TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX login_codes_target ON login_codes(channel, target);

-- Passkeys (WebAuthn credentials). public_key is base64url COSE.
CREATE TABLE passkeys (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key    TEXT NOT NULL,
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT NOT NULL DEFAULT '[]',
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_used_at  TEXT
);
CREATE INDEX passkeys_user ON passkeys(user_id);

-- Short-lived WebAuthn challenges, keyed by a hash of a cookie token.
CREATE TABLE webauthn_challenges (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('register', 'login')),
  challenge  TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
