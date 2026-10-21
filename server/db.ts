import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export type Row = Record<string, any>;
type Params = Record<string, SQLInputValue> | SQLInputValue[];

/**
 * Thin wrapper over node:sqlite. All access is synchronous, so a transaction
 * that contains no `await` cannot interleave with another request — this is
 * what makes stock reservation and order creation concurrency-safe.
 */
export class Db {
  readonly raw: DatabaseSync;
  private depth = 0;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.raw = new DatabaseSync(path);
    this.raw.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    if (path !== ":memory:") this.raw.exec("PRAGMA journal_mode = WAL;");
  }

  private bind(params?: Params): SQLInputValue[] | [Record<string, SQLInputValue>] {
    if (params === undefined) return [];
    return Array.isArray(params) ? params : [params];
  }

  get<T = Row>(sql: string, params?: Params): T | undefined {
    return this.raw.prepare(sql).get(...(this.bind(params) as SQLInputValue[])) as T | undefined;
  }

  all<T = Row>(sql: string, params?: Params): T[] {
    return this.raw.prepare(sql).all(...(this.bind(params) as SQLInputValue[])) as T[];
  }

  run(sql: string, params?: Params): { changes: number; lastId: number } {
    const r = this.raw.prepare(sql).run(...(this.bind(params) as SQLInputValue[]));
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
