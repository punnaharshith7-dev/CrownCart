import { useState } from "react";
import { SelectField, TextField } from "./ui";

export interface ServiceArea {
  city: string;
  state: string;
  pincodes: string[];
}

export const emptyServiceArea: ServiceArea = { city: "", state: "", pincodes: [] };

/** Reads the comma-separated list the server stores back into an editable value. */
export const serviceAreaFrom = (city: string, state: string, servicePincodes: string): ServiceArea => ({
  city,
  state,
  pincodes: servicePincodes.split(/[\s,]+/).filter(Boolean),
});

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const PIN = /^[1-9]\d{5}$/;

/** City, state and the PIN codes a delivery partner covers. Controlled; validates PIN codes as they're added. */
export function ServiceAreaFields({ value, onChange }: { value: ServiceArea; onChange: (v: ServiceArea) => void }) {
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // Accepts one PIN or a pasted list ("500001, 500002 500003").
  const add = () => {
    const parts = draft.split(/[\s,]+/).filter(Boolean);
    if (!parts.length) return;
    const bad = parts.filter((p) => !PIN.test(p));
    if (bad.length) return setErr(`${bad.join(", ")} ${bad.length > 1 ? "aren't" : "isn't"} a valid 6-digit PIN code.`);
    onChange({ ...value, pincodes: [...new Set([...value.pincodes, ...parts])] });
    setDraft("");
    setErr(null);
  };

  return (
    <div className="stack" style={{ "--gap": "14px" } as React.CSSProperties}>
      <div className="grid" style={{ "--min": "180px" } as React.CSSProperties}>
        <TextField label="City" required autoComplete="address-level2" value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} />
        <SelectField label="State" required value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })}>
          <option value="">Choose a state…</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <TextField
              label="PIN codes you can deliver to"
              inputMode="numeric"
              placeholder="e.g. 500001, 500002"
              value={draft}
              error={err ?? undefined}
              hint="Type one or more 6-digit PIN codes, then press Enter or Add."
              onChange={(e) => (setDraft(e.target.value), setErr(null))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") (e.preventDefault(), add());
              }}
              onBlur={() => draft.trim() && add()}
            />
          </div>
          <button type="button" className="btn btn-outline" style={{ marginBottom: err ? 26 : 22 }} onClick={add}>
            Add
          </button>
        </div>
        {value.pincodes.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", "--gap": "6px" } as React.CSSProperties} aria-label="PIN codes added">
            {value.pincodes.map((p) => (
              <span key={p} className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {p}
                <button type="button" className="link" aria-label={`Remove ${p}`} onClick={() => onChange({ ...value, pincodes: value.pincodes.filter((x) => x !== p) })}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Client-side check before submitting; the server validates again. */
export function serviceAreaError(v: ServiceArea) {
  if (v.city.trim().length < 2) return "Enter your city.";
  if (!v.state) return "Choose your state.";
  if (!v.pincodes.length) return "Add at least one PIN code you can deliver to.";
  return null;
}
