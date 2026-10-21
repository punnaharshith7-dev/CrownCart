import type { Context } from "hono";
import type { Db } from "./db.ts";
import type { AdminPermission, RoleKey } from "./lib/permissions.ts";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  roles: RoleKey[];
  permissions: Set<AdminPermission>;
  sessionId: string;
}

export type AppEnv = {
  Variables: {
    db: Db;
    user: SessionUser | null;
    ip: string;
  };
};

export type Ctx = Context<AppEnv>;
