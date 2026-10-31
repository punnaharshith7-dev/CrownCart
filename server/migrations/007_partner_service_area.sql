-- Delivery partners state where they work when they join; service_pincodes lists the PIN codes they cover.
ALTER TABLE delivery_partners ADD COLUMN city TEXT NOT NULL DEFAULT '';
ALTER TABLE delivery_partners ADD COLUMN state TEXT NOT NULL DEFAULT '';
