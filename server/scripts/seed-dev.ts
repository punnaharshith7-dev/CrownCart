// Creates one development account per role. Refuses to run in production.
import { config } from "../config.ts";
import { Db } from "../db.ts";
import { ensureReferenceData, seedCatalog, seedDevAccounts } from "../seed.ts";

if (config.isProd) {
  console.error("Refusing to create demo accounts in production. Use `npm run create-admin` instead.");
  process.exit(1);
}
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 10) {
  console.error("Set SEED_PASSWORD (10+ characters) in .env or the environment, then run again.");
  process.exit(1);
}
const db = new Db(config.databasePath);
db.migrate();
ensureReferenceData(db);
seedCatalog(db);
const emails = await seedDevAccounts(db, password);
console.log(`Development accounts ready (password = SEED_PASSWORD):\n  ${emails.join("\n  ")}`);
