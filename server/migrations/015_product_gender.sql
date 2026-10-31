-- Who a product is made for. NULL means it doesn't apply, such as electronics.
ALTER TABLE products ADD COLUMN gender TEXT CHECK (gender IN ('men', 'women', 'unisex'));
