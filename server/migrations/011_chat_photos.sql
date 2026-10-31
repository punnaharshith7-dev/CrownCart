-- Photos customers attach in "Chat about this item" conversations. Stores the file name
-- inside PRIVATE_STORAGE_DIR/support-photos; served only to the customer and support admins.
ALTER TABLE ticket_messages ADD COLUMN photo TEXT;
