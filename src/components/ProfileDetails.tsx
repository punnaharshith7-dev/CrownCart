import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { Button, Modal, SelectField, TextField } from "./ui";

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export interface ProfileDetailsValue {
  name: string;
  age: string;
  phone: string;
  gender: string;
  heightCm: string;
  weightKg: string;
}

export const profileDetailsFrom = (p: { name?: string; age?: number | null; phone?: string | null; gender?: string | null; heightCm?: number | null; weightKg?: number | null }): ProfileDetailsValue => ({
  name: p.name ?? "",
  age: p.age != null ? String(p.age) : "",
  phone: p.phone ?? "",
  gender: p.gender ?? "",
  heightCm: p.heightCm != null ? String(p.heightCm) : "",
  weightKg: p.weightKg != null ? String(p.weightKg) : "",
});

/** The API payload: blank optional fields are cleared (null). */
export const profileDetailsPayload = (v: ProfileDetailsValue) => ({
  name: v.name.trim(),
  age: v.age.trim() ? Number(v.age) : null,
  phone: v.phone.trim() || null,
  gender: v.gender || null,
  heightCm: v.heightCm.trim() ? Number(v.heightCm) : null,
  weightKg: v.weightKg.trim() ? Number(v.weightKg) : null,
});

/** Name, age, phone, gender, height and weight. Everything but the name may be left blank. */
export function ProfileDetailsFields({ value, onChange }: { value: ProfileDetailsValue; onChange: (v: ProfileDetailsValue) => void }) {
  const set = (k: keyof ProfileDetailsValue, clean?: (s: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: clean ? clean(e.target.value) : e.target.value });
  const digits = (s: string) => s.replace(/\D/g, "");
  const decimal = (s: string) => s.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  return (
    <div className="stack" style={{ "--gap": "14px" } as React.CSSProperties}>
      <TextField label="Name" autoComplete="name" required value={value.name} onChange={set("name")} />
      <div className="grid" style={{ "--min": "150px" } as React.CSSProperties}>
        <TextField label="Age" inputMode="numeric" maxLength={3} placeholder="e.g. 24" value={value.age} onChange={set("age", digits)} />
        <SelectField label="Gender" value={value.gender} onChange={set("gender")}>
          <option value="">Select…</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label="Phone number" type="tel" autoComplete="tel" inputMode="tel" placeholder="10-digit mobile number" value={value.phone} onChange={set("phone")} />
      <div className="grid" style={{ "--min": "150px" } as React.CSSProperties}>
        <TextField label="Height (cm)" inputMode="decimal" placeholder="e.g. 170" value={value.heightCm} onChange={set("heightCm", decimal)} />
        <TextField label="Weight (kg)" inputMode="decimal" placeholder="e.g. 65" value={value.weightKg} onChange={set("weightKg", decimal)} />
      </div>
    </div>
  );
}

// Pages where the prompt would interrupt signing in or accepting an invite.
const SKIP_PATHS = ["/signin", "/register", "/invite", "/verify-email", "/reset-password", "/forgot-password"];

/** Shown once to a newly created account; saving or skipping both dismiss it for good. */
export function ProfilePrompt() {
  const { user, refresh } = useAuth();
  const { pathname } = useLocation();
  const toast = useToast();
  const [value, setValue] = useState<ProfileDetailsValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const show = Boolean(user?.needsProfile) && !SKIP_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (show && !value) setValue(profileDetailsFrom({ name: user!.name }));
  }, [show, value, user]);

  if (!show || !value) return null;
  const skip = async () => {
    await api.post("/account/profile/skip").catch(() => {});
    await refresh();
  };
  return (
    <Modal title="Tell us about you" onClose={skip}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            await api.patch("/account/profile", profileDetailsPayload(value));
            await refresh();
            toast("Profile saved.", "success");
          } catch (e2) {
            setErr(errorMessage(e2));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="small muted" style={{ marginTop: 0 }}>
          Helps us suggest the right sizes and fits. Everything except your name is optional, and you can change it any time in Account → Settings.
        </p>
        <ProfileDetailsFields value={value} onChange={setValue} />
        {err && <div className="alert alert-danger">{err}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={skip}>
            Skip for now
          </button>
          <Button type="submit" loading={busy} disabled={value.name.trim().length < 2}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
