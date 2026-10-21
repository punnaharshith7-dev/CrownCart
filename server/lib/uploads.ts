import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomToken } from "./crypto.ts";
import { badRequest } from "./errors.ts";

/** Allowed upload kinds, identified by magic bytes — never by the client's filename or MIME type. */
const KINDS = [
  { ext: "jpg", kind: "image", max: 8 << 20, test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", kind: "image", max: 8 << 20, test: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", kind: "image", max: 8 << 20, test: (b: Buffer) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { ext: "mp4", kind: "video", max: 60 << 20, test: (b: Buffer) => b.toString("ascii", 4, 8) === "ftyp" },
  { ext: "glb", kind: "model", max: 40 << 20, test: (b: Buffer) => b.toString("ascii", 0, 4) === "glTF" },
] as const;

export type UploadKind = (typeof KINDS)[number]["kind"];

export function sniff(buf: Buffer) {
  return KINDS.find((k) => k.test(buf)) ?? null;
}

/**
 * Validates and stores an uploaded file under a random name. Returns the
 * stored filename. Nothing executable can pass the magic-byte check.
 */
export async function saveUpload(file: File, dir: string, allowed: UploadKind[]): Promise<{ name: string; kind: UploadKind }> {
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !allowed.includes(type.kind)) {
    throw badRequest(`Unsupported file. Allowed: ${allowed.join(", ")} (${KINDS.filter((k) => allowed.includes(k.kind)).map((k) => k.ext).join(", ")}).`);
  }
  if (buf.length > type.max) throw badRequest(`File is too large (max ${type.max >> 20} MB).`);
  mkdirSync(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomToken(9)}.${type.ext}`;
  writeFileSync(join(dir, name), buf, { flag: "wx" });
  return { name, kind: type.kind };
}
