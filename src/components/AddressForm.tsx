import { useState, type FormEvent } from "react";
import { ApiError, api, errorMessage } from "../lib/api";
import { Button, SelectField, TextField } from "./ui";

export interface Address {
  id: number;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  serviceable?: boolean;
}

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export function formatAddress(a: Pick<Address, "line1" | "line2" | "city" | "state" | "pincode">) {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(", ");
}

export function AddressForm({ initial, onSaved, onCancel }: { initial?: Address; onSaved: (a: Address) => void; onCancel?: () => void }) {
  const [f, setF] = useState({
    label: initial?.label ?? "Home",
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const r = initial ? await api.put<{ address: Address }>(`/account/addresses/${initial.id}`, f) : await api.post<{ address: Address }>("/account/addresses", f);
      onSaved(r.address);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFields(err.fields);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="grid" style={{ "--min": "220px" } as React.CSSProperties}>
        <TextField label="Full name" autoComplete="name" required value={f.name} onChange={set("name")} error={fields.name} />
        <TextField label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" required value={f.phone} onChange={set("phone")} error={fields.phone} hint="For delivery updates" />
      </div>
      <TextField label="Address line 1" autoComplete="address-line1" required value={f.line1} onChange={set("line1")} error={fields.line1} placeholder="House / flat, street" />
      <TextField label="Address line 2" autoComplete="address-line2" value={f.line2} onChange={set("line2")} error={fields.line2} placeholder="Area, landmark (optional)" />
      <div className="grid" style={{ "--min": "160px" } as React.CSSProperties}>
        <TextField label="City" autoComplete="address-level2" required value={f.city} onChange={set("city")} error={fields.city} />
        <SelectField label="State" autoComplete="address-level1" required value={f.state} onChange={set("state")} error={fields.state}>
          <option value="">Select…</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <TextField label="PIN code" autoComplete="postal-code" inputMode="numeric" maxLength={6} required value={f.pincode} onChange={set("pincode")} error={fields.pincode} />
      </div>
      <div className="row">
        <SelectField label="Label" value={f.label} onChange={set("label")}>
          <option>Home</option>
          <option>Work</option>
          <option>Other</option>
        </SelectField>
        <label className="check" style={{ marginTop: 22 }}>
          <input type="checkbox" checked={f.isDefault} onChange={set("isDefault")} />
          <span>Make this my default address</span>
        </label>
      </div>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <Button loading={busy} type="submit">
          Save address
        </Button>
      </div>
    </form>
  );
}
