import Database from "libsql";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export type Row = Record<string, any>;
type SQLValue = string | number | bigint | null;
type Params = Record<string, SQLValue> | SQLValue[];

export type RemoteOptions = { syncUrl: string; authToken: string };

/** libsql aborts the whole process on values it cannot bind, so they are refused here with a normal error. */
function assertBindable(value: unknown) {
  const type = typeof value;
  if (value === null || type === "string" || type === "number" || type === "bigint") return;
  throw new TypeError(`Provided value cannot be bound to a SQL parameter (${value === undefined ? "undefined" : type}).`);
}

/**
 * Thin wrapper over libsql. All access is synchronous, so a transaction that
 * contains no `await` cannot interleave with another request — this is what
 * makes stock reservation and order creation concurrency-safe. That holds for
 * one server process per database, which is how CrownCart is deployed.
 *
 * With `remote` set, the file at `path` is a replica of a hosted Turso database:
 * reads are local, writes go to Turso, and the file can be lost safely because
 * it is downloaded again on startup.
 */
export class Db {
  readonly raw: InstanceType<typeof Database>;
  private depth = 0;

  constructor(path: string, remote?: RemoteOptions | null) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.raw = remote ? new Database(path, remote) : new Database(path);
    if (remote) this.raw.sync();
    this.raw.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    if (path !== ":memory:" && !remote) this.raw.exec("PRAGMA journal_mode = WAL;");
  }

  /** Always one argument: libsql rejects a bare null passed as the first positional value. */
  private bind(params?: Params): [] | [Params] {
    if (params === undefined) return [];
    (Array.isArray(params) ? params : Object.values(params)).forEach(assertBindable);
    return [params];
  }

  get<T = Row>(sql: string, params?: Params): T | undefined {
    const row = this.raw.prepare(sql).get(...this.bind(params)) as (Row & { _metadata?: unknown }) | undefined;
    // libsql adds timing data to single-row results; callers spread rows into API responses.
    if (row) delete row._metadata;
    return row as T | undefined;
  }

  all<T = Row>(sql: string, params?: Params): T[] {
    return this.raw.prepare(sql).all(...this.bind(params)) as T[];
  }

  run(sql: string, params?: Params): { changes: number; lastId: number } {
    const r = this.raw.prepare(sql).run(...this.bind(params));
    return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  }

  /** Runs fn atomically. Nested calls join the outer transaction. */
  tx<T>(fn: () => T): T {
    if (this.depth > 0) {
      this.depth++;
      try {
        return fn();
      } finally {
        this.depth--;
      }
    }
    this.raw.exec("BEGIN IMMEDIATE");
    this.depth = 1;
    try {
      const result = fn();
      if (result instanceof Promise) throw new Error("db.tx callback must be synchronous");
      this.raw.exec("COMMIT");
      return result;
    } catch (err) {
      this.raw.exec("ROLLBACK");
      throw err;
    } finally {
      this.depth = 0;
    }
  }

  migrate(): string[] {
    this.raw.exec(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
    );
    const dir = join(here, "migrations");
    const applied = new Set(this.all<{ name: string }>("SELECT name FROM schema_migrations").map((r) => r.name));
    const ran: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(dir, file), "utf8");
      this.tx(() => {
        this.raw.exec(sql);
        this.run("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)", [file, new Date().toISOString()]);
      });
      ran.push(file);
    }
    return ran;
  }
}

export const now = () => new Date().toISOString();
