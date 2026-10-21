import { useEffect, useState } from "react";

interface Banner {
  announcement: string;
  maintenance: { enabled: boolean; message: string };
}

let cache: Promise<Banner | null> | null = null;
const load = () =>
  (cache ??= fetch("/api/catalog/home")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d ? { announcement: d.homepage.announcement ?? "", maintenance: d.maintenance } : null))
    .catch(() => null));

const DISMISS_KEY = "cc-dismissed-announcement";

/** Admin-configured announcement and maintenance notice. Dismissals are remembered per announcement text. */
export function Announcement() {
  const [b, setB] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    load().then(setB);
  }, []);
  if (!b) return null;
  if (b.maintenance?.enabled) {
    return (
      <div role="status" style={{ background: "#a35c00", color: "#fff", textAlign: "center", padding: "8px 16px", fontSize: 13, fontFamily: "var(--font-body)" }}>
        {b.maintenance.message}
      </div>
    );
  }
  if (!b.announcement || dismissed === b.announcement) return null;
  return (
    <div role="status" style={{ background: "#111111", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "8px 16px", fontSize: 13, fontFamily: "var(--font-body)" }}>
      <span>{b.announcement}</span>
      <button
        type="button"
        aria-label="Dismiss announcement"
        style={{ background: "none", border: "none", color: "inherit", opacity: 0.7, cursor: "pointer" }}
        onClick={() => {
          setDismissed(b.announcement);
          try {
            localStorage.setItem(DISMISS_KEY, b.announcement);
          } catch {
            /* remembered for this visit only */
          }
        }}
      >
        ✕
      </button>
    </div>
  );
}
