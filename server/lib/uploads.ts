import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.ts";
import { randomToken } from "./crypto.ts";
import { HttpError, badRequest } from "./errors.ts";

/** Allowed upload kinds, identified by magic bytes — never by the client's filename or MIME type. */
const KINDS = [
  { ext: "jpg", kind: "image", max: 8 << 20, test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", kind: "image", max: 8 << 20, test: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", kind: "image", max: 8 << 20, test: (b: Buffer) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { ext: "mp4", kind: "video", max: 60 << 20, test: (b: Buffer) => b.toString("ascii", 4, 8) === "ftyp" },
  { ext: "glb", kind: "model", max: 40 << 20, test: (b: Buffer) => b.toString("ascii", 0, 4) === "glTF" },
] as const;

export type UploadKind = (typeof KINDS)[number]["kind"];
type Sniffed = (typeof KINDS)[number];

export function sniff(buf: Buffer) {
  return KINDS.find((k) => k.test(buf)) ?? null;
}

async function validate(file: File, allowed: UploadKind[]) {
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !allowed.includes(type.kind)) {
    throw badRequest(`Unsupported file. Allowed: ${allowed.join(", ")} (${KINDS.filter((k) => allowed.includes(k.kind)).map((k) => k.ext).join(", ")}).`);
  }
  if (buf.length > type.max) throw badRequest(`File is too large (max ${type.max >> 20} MB).`);
  // A random name: nothing about the client's filename reaches storage.
  const name = `${Date.now().toString(36)}-${randomToken(9)}.${type.ext}`;
  return { buf, type, name };
}

/* ---------- Cloudinary: permanent storage for hosts whose disk is wiped on restart ---------- */

const cloudinaryOn = () => Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);

function sign(params: Record<string, string>) {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(toSign + config.cloudinary.apiSecret).digest("hex");
}

const resourceType = (type: Sniffed) => (type.kind === "video" ? "video" : type.kind === "model" ? "raw" : "image");

async function cloudinaryUpload(buf: Buffer, type: Sniffed, publicId: string, deliveryType: "upload" | "authenticated") {
  const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)), type: deliveryType };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.set(k, v);
  form.set("api_key", config.cloudinary.apiKey);
  form.set("signature", sign(params));
  form.set("file", new Blob([new Uint8Array(buf)]), `upload.${type.ext}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/${resourceType(type)}/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const body = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !body?.secure_url) {
    console.error(`[uploads] Cloudinary refused an upload (${res.status}): ${body?.error?.message ?? "no details"}`);
    // 400 is the plan's own limit (usually file size), which the person uploading can act on.
    if (res.status === 400) throw badRequest(`The file could not be stored: ${body?.error?.message ?? "rejected by storage"}.`);
    throw new HttpError(502, "storage_failed", "The file could not be stored. Please try again.");
  }
  return body.secure_url;
}

const privateId = (folder: string, name: string) => `crowncart/private/${folder}/${name.replace(/\.[^.]+$/, "")}`;

/* ---------- Public and private uploads ---------- */

/** Validates and stores a file anyone may view. Returns the URL to save with the record. */
export async function savePublicUpload(file: File, folder: "" | "reviews", allowed: UploadKind[]): Promise<{ url: string; kind: UploadKind }> {
  const { buf, type, name } = await validate(file, allowed);
  if (cloudinaryOn()) {
    // Cloudinary keeps the extension as part of the id only for raw files.
    const base = type.kind === "model" ? name : name.replace(/\.[^.]+$/, "");
    const publicId = ["crowncart/public", folder, base].filter(Boolean).join("/");
    return { url: await cloudinaryUpload(buf, type, publicId, "upload"), kind: type.kind };
  }
  const dir = join(config.publicUploadDir, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), buf, { flag: "wx" });
  return { url: `/uploads/${folder ? `${folder}/` : ""}${name}`, kind: type.kind };
}

/** Validates and stores a file only the API may hand out, after its own permission check. Returns the stored name. */
export async function savePrivateUpload(file: File, folder: string, allowed: UploadKind[]): Promise<{ name: string; kind: UploadKind }> {
  const { buf, type, name } = await validate(file, allowed);
  if (cloudinaryOn()) {
    await cloudinaryUpload(buf, type, privateId(folder, name), "authenticated");
    return { name, kind: type.kind };
  }
  const dir = join(config.privateStorageDir, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), buf, { flag: "wx" });
  return { name, kind: type.kind };
}

/** Reads a private file, or null when it does not exist. */
export async function readPrivateUpload(folder: string, name: string): Promise<Buffer | null> {
  const path = join(config.privateStorageDir, folder, name);
  if (existsSync(path)) return readFileSync(path);
  if (!cloudinaryOn()) return null;
  const params = {
    format: name.slice(name.lastIndexOf(".") + 1),
    public_id: privateId(folder, name),
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: "authenticated",
  };
  const query = new URLSearchParams({ ...params, api_key: config.cloudinary.apiKey, signature: sign(params) });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/download?${query}`, { signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(502, "storage_failed", "The photo could not be loaded. Please try again.");
  return Buffer.from(await res.arrayBuffer());
}

/** Removes a private file. Never throws: it is only used to clean up after a refused step. */
export async function deletePrivateUpload(folder: string, name: string): Promise<void> {
  try {
    if (cloudinaryOn()) {
      const params = { public_id: privateId(folder, name), timestamp: String(Math.floor(Date.now() / 1000)), type: "authenticated" };
      const form = new URLSearchParams({ ...params, api_key: config.cloudinary.apiKey, signature: sign(params) });
      await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/destroy`, { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
    } else {
      unlinkSync(join(config.privateStorageDir, folder, name));
    }
  } catch {
    /* already gone */
  }
}
