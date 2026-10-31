-- Optional personal details asked once after sign-up; editable later in account settings.
ALTER TABLE users ADD COLUMN age INTEGER;
ALTER TABLE users ADD COLUMN gender TEXT;
ALTER TABLE users ADD COLUMN height_cm REAL;
ALTER TABLE users ADD COLUMN weight_kg REAL;
-- Set once the user saves or skips the sign-up profile step.
ALTER TABLE users ADD COLUMN profile_prompted_at TEXT;

-- Accounts that existed before this step was introduced aren't prompted.
UPDATE users SET profile_prompted_at = created_at;
