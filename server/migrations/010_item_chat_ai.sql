-- Direct chats about one ordered product, and AI auto-replies inside them.
-- order_item_id: set for "Chat about this item" conversations (NULL for contact-form tickets).
ALTER TABLE support_tickets ADD COLUMN order_item_id INTEGER REFERENCES order_items(id);
-- is_ai: the message was written by the AI auto-reply rather than a person.
ALTER TABLE ticket_messages ADD COLUMN is_ai INTEGER NOT NULL DEFAULT 0;
