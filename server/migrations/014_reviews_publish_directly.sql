-- Reviews from customers who received the product now go live straight away.
UPDATE reviews SET status = 'published' WHERE status = 'pending';
DELETE FROM settings WHERE key = 'reviews';
