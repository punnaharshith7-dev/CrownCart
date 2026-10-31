// Secure first-administrator provisioning:
//   INITIAL_ADMIN_EMAIL=crowncart.admin@gmail.com INITIAL_ADMIN_PASSWORD='…' npm run create-admin
// The password is read from the environment so it never lands in shell history as an argument.
import { config } from "../config.ts";
import { Db } from "../db.ts";
import { hashPassword } from "../lib/crypto.ts";
import { ensureReferenceData } from "../seed.ts";

const email = (process.env.INITIAL_ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD ?? "";
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 14) {
  console.error("Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD (14+ characters).");
  process.exit(1);
}
const db = new Db(config.databasePath);
db.migrate();
ensureReferenceData(db);
const hash = await hashPassword(password);
db.tx(() => {
  let user = db.get("SELECT id FROM users WHERE email = ?", [email]);
  if (!user) {
    user = { id: db.run("INSERT INTO users (email, password_hash, name, email_verified_at) VALUES (?, ?, 'Administrator', strftime('%Y-%m-%dT%H:%M:%fZ','now'))", [email, hash]).lastId };
  }
  for (const role of ["customer", "platform_admin"]) {
    db.run("INSERT OR IGNORE INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE key = ?", [user.id, role]);
  }
  db.run("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details) VALUES (NULL, 'role.grant', 'user', ?, '{\"role\":\"platform_admin\",\"via\":\"create-admin script\"}')", [String(user.id)]);
});
console.log(`${email} is a platform administrator. Remove INITIAL_ADMIN_PASSWORD from the environment now.`);
