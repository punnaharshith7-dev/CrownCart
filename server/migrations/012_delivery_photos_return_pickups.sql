-- Proof-of-delivery photos and courier pickups for returns.
-- A return pickup is a shipment of kind 'return' linked to the return request it collects.
ALTER TABLE shipments ADD COLUMN return_id INTEGER REFERENCES return_requests(id);
CREATE INDEX shipments_return ON shipments(return_id);
-- Photo taken by the delivery partner at a step (file name in PRIVATE_STORAGE_DIR/delivery-photos):
-- the doorstep photo on delivery, the item-condition photo on a return pickup.
ALTER TABLE delivery_status_history ADD COLUMN photo TEXT;
