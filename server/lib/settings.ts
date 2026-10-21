import type { Db } from "../db.ts";

/** Platform settings with their defaults. Stored as JSON in the settings table. */
export const SETTING_DEFAULTS = {
  brand: {
    name: "CrownCart",
    tagline: "Beyond Ordinary.",
    supportingLine: "Discover a world of extraordinary choices.",
    supportEmail: "support@crowncart.local",
    supportPhone: "",
  },
  homepage: {
    announcement: "",
    sections: [
      { key: "home", number: "01", label: "Home", description: "Return to overview", visible: true },
      { key: "explore", number: "01", label: "Explore", description: "The interactive showcase", visible: true },
      { key: "collections", number: "02", label: "Collections", description: "Fashion, technology & lifestyle", visible: true },
      { key: "why", number: "03", label: "Why CrownCart", description: "Quality, service & security", visible: true },
      { key: "story", number: "04", label: "Our Story", description: "Vision, mission and craft", visible: true },
      { key: "contact", number: "05", label: "Contact", description: "Customer support & enquiries", visible: true },
    ],
  },
  shipping: { flatPaise: 14900, freeThresholdPaise: 500000, estimateDaysMin: 3, estimateDaysMax: 7, serviceablePincodePrefixes: [] as string[] },
  cod: { enabled: true, maxOrderPaise: 5000000 },
  checkout: { requireVerifiedEmail: true, paymentWindowMinutes: 30 },
  tax: { mode: "inclusive", note: "All prices are inclusive of applicable GST." },
  delivery: { requireOtp: true },
  returns: { enabled: true },
  reviews: { requireModeration: true, verifiedPurchaseOnly: false },
  maintenance: { enabled: false, message: "CrownCart is undergoing scheduled maintenance. Please check back shortly." },
  features: { wishlist: true, reviews: true, coupons: true },
};

export type Settings = typeof SETTING_DEFAULTS;
export type SettingKey = keyof Settings;

export function getSetting<K extends SettingKey>(db: Db, key: K): Settings[K] {
  const row = db.get<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  if (!row) return SETTING_DEFAULTS[key];
  try {
    return { ...SETTING_DEFAULTS[key], ...JSON.parse(row.value) };
  } catch {
    return SETTING_DEFAULTS[key];
  }
}

export function setSetting<K extends SettingKey>(db: Db, key: K, value: Settings[K], actorId: number | null) {
  db.run(
    `INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    [key, JSON.stringify(value), actorId],
  );
}

export function allSettings(db: Db): Settings {
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) out[key] = getSetting(db, key);
  return out as Settings;
}
