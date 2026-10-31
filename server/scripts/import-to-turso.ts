// Copies a local CrownCart database into an empty hosted one, moving uploaded files to Cloudinary on
// the way. The source is opened read-only and the target must be empty, so a mistake cannot damage
// either. Every row is read back and compared before it reports success.
//
//   node --disable-warning=ExperimentalWarning server/scripts/import-to-turso.ts <source.db> <uploads dir> <target>
//
// <target> is a libsql:// URL (token in TURSO_AUTH_TOKEN) or, for a trial run, a local file path.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join, relative } from "node:path";
import Database from "libsql";
import { config } from "../config.ts";
import { savePublicUpload } from "../lib/uploads.ts";

const [sourcePath, uploadsDir, target] = process.argv.slice(2);
if (!sourcePath || !uploadsDir || !target) {
  console.error("Usage: import-to-turso.ts <source.db> <uploads dir> <libsql:// URL or file>");
  process.exit(1);
}
if (!existsSync(sourcePath)) throw new Error(`Source database not found: ${sourcePath}`);

const source = new DatabaseSync(sourcePath, { readOnly: true });
const isRemote = /^(libsql|https?):/.test(target);
const dest = isRemote ? new Database(target, { authToken: process.env.TURSO_AUTH_TOKEN ?? "" } as object) : new Database(target);
const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
const BATCH = 100;

const existing = dest.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%'").get() as { c: number };
if (existing.c > 0) throw new Error(`The target already has ${existing.c} table(s). Refusing to touch it: use an empty database.`);

/* Move uploaded files first, so rows can be written with their permanent addresses. */
function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const urlMap = new Map<string, string>();
const files = listFiles(uploadsDir);
if (files.length && !config.cloudinary.cloudName && isRemote) throw new Error("Set the CLOUDINARY_* values first, or the uploaded files would be lost.");
if (config.cloudinary.cloudName) {
  for (const path of files) {
    const rel = relative(uploadsDir, path).replace(/\\/g, "/");
    const folder = rel.startsWith("reviews/") ? "reviews" : "";
    const { url } = await savePublicUpload(new File([new Uint8Array(readFileSync(path))], "upload"), folder, ["image", "video", "model"]);
    urlMap.set(`/uploads/${rel}`, url);
    console.log(`  file  /uploads/${rel} -> ${url}`);
  }
}

const rewrite = (value: unknown) => {
  if (typeof value !== "string" || !value.includes("/uploads/")) return value;
  let out = value;
  for (const [from, to] of urlMap) out = out.replaceAll(from, to);
  return out;
};

/* Schema, then rows, then indexes and triggers, so inserts are not slowed or blocked by them. */
const objects = source.prepare("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'").all() as { type: string; name: string; sql: string }[];
const tables = objects.filter((o) => o.type === "table").map((o) => o.name);
for (const o of objects.filter((o) => o.type === "table")) dest.exec(o.sql);

const readRows = (table: string) => source.prepare(`SELECT * FROM ${quote(table)}`).all() as Record<string, any>[];

dest.exec("BEGIN IMMEDIATE");
try {
  // Tables reference each other, so foreign keys are checked at commit rather than row by row.
  dest.exec("PRAGMA defer_foreign_keys = ON");
  for (const table of tables) {
    const rows = readRows(table);
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]);
    const one = `(${cols.map(() => "?").join(",")})`;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const values = batch.flatMap((r) => cols.map((col) => rewrite(r[col]) ?? null));
      dest.prepare(`INSERT INTO ${quote(table)} (${cols.map(quote).join(",")}) VALUES ${batch.map(() => one).join(",")}`).run(values);
    }
    console.log(`  table ${table}: ${rows.length}`);
  }
  // Keeps ids of deleted records from being reused, for example old order numbers.
  const hasSequence = source.prepare("SELECT 1 AS y FROM sqlite_master WHERE name = 'sqlite_sequence'").get();
  if (hasSequence) {
    for (const s of source.prepare("SELECT name, seq FROM sqlite_sequence").all() as { name: string; seq: number }[]) {
      const changed = dest.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = ?").run([s.seq, s.name]);
      if (!changed.changes) dest.prepare("INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)").run([s.name, s.seq]);
    }
  }
  dest.exec("COMMIT");
} catch (err) {
  dest.exec("ROLLBACK");
  throw err;
}
for (const o of objects.filter((o) => o.type !== "table")) dest.exec(o.sql);

/* Read everything back and compare it value by value. */
let compared = 0;
const problems: string[] = [];
for (const table of tables) {
  const order = (source.prepare(`PRAGMA table_info(${quote(table)})`).all() as { name: string }[]).map((c) => quote(c.name)).join(",");
  const a = source.prepare(`SELECT * FROM ${quote(table)} ORDER BY ${order}`).all() as Record<string, any>[];
  const b = dest.prepare(`SELECT * FROM ${quote(table)} ORDER BY ${order}`).all() as Record<string, any>[];
  if (a.length !== b.length) {
    problems.push(`${table}: ${a.length} rows in source, ${b.length} in target`);
    continue;
  }
  a.forEach((row, i) => {
    for (const col of Object.keys(row)) {
      if (rewrite(row[col]) !== b[i][col]) problems.push(`${table} row ${i}, column ${col} differs`);
    }
  });
  compared += a.length;
}
if (problems.length) {
  console.error(`IMPORT NOT CLEAN. ${problems.length} problem(s):\n${problems.slice(0, 20).join("\n")}`);
  process.exit(1);
}
console.log(`Import verified: ${compared} rows across ${tables.length} tables, ${urlMap.size} files moved.`);
