-- Links an account to a Microsoft identity (tenant id + object id, never the email).
ALTER TABLE users ADD COLUMN microsoft_sub TEXT;
CREATE UNIQUE INDEX users_microsoft_sub ON users(microsoft_sub) WHERE microsoft_sub IS NOT NULL;
