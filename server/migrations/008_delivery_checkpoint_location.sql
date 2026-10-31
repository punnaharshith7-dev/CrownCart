-- Each delivery step a partner ticks off records where it happened, shown to customers and staff.
ALTER TABLE delivery_status_history ADD COLUMN location TEXT NOT NULL DEFAULT '';
