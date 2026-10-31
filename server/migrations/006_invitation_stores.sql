-- A store-owner invitation can cover several stores. invitations.store_id keeps the first one.
CREATE TABLE invitation_stores (
  invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  store_id      INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  PRIMARY KEY (invitation_id, store_id)
);

INSERT INTO invitation_stores (invitation_id, store_id) SELECT id, store_id FROM invitations WHERE store_id IS NOT NULL;
