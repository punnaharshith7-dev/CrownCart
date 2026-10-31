import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, api, errorMessage } from "../../lib/api";
import { useAuth, type Me } from "../../lib/auth";
import { Button, TextField } from "../../components/ui";
import { useStage } from "./AuthStage";

/** Runs a sign-in call, then celebrates and navigates. Supplied by the page. */
export type RunLogin = (login: () => Promise<Me>) => Promise<void>;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function PasskeyMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v1.5M17 9.5V8a5 5 0 0 0-2.2-4.1" />
      <path d="M7 13c0 3 1 5.5 2.5 7.5M12 11v3c0 2.5.8 4.7 2 6.5M17 13c0 1.6.2 3 .7 4.3" />
    </svg>
  );
}

const isIpHost = () => /^\d+\.\d+\.\d+\.\d+$|^\[/.test(location.hostname);

/** Google, Microsoft and (on sign-in) passkey, then an "or" divider before the other methods. */
export function SocialSignIn({ returnTo, run, onError }: { returnTo: string; run?: RunLogin; onError?: (msg: string | null) => void }) {
  const q = `?returnTo=${encodeURIComponent(returnTo || "/")}`;
  const [busy, setBusy] = useState(false);

  const passkey = async () => {
    if (!run) return;
    onError?.(null);
    if (!window.PublicKeyCredential) return onError?.("This browser doesn't support passkeys.");
    if (isIpHost()) return onError?.("Passkeys need the site's name, not an IP address. Open localhost:5173 (or the live domain) instead.");
    setBusy(true);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      await run(async () => {
        const optionsJSON = await api.post<any>("/auth/passkeys/login/options");
        const response = await startAuthentication({ optionsJSON });
        return (await api.post<{ user: Me }>("/auth/passkeys/login/verify", { response })).user;
      });
    } catch (e) {
      setBusy(false);
      // Closing the passkey prompt isn't an error worth shouting about.
      if (e instanceof Error && (e.name === "NotAllowedError" || e.name === "AbortError")) return;
      onError?.(errorMessage(e));
    }
  };

  return (
    <>
      <div className={`cc-social${run ? " cc-social-3" : ""}`}>
        <a className="cc-social-btn" href={`/api/auth/google/start${q}`} aria-label="Continue with Google">
          <GoogleMark />
          <span>Google</span>
        </a>
        <a className="cc-social-btn" href={`/api/auth/microsoft/start${q}`} aria-label="Continue with Microsoft">
          <MicrosoftMark />
          <span>Microsoft</span>
        </a>
        {run && (
          <button type="button" className="cc-social-btn" onClick={passkey} disabled={busy} aria-label="Sign in with a passkey">
            {busy ? <span className="spinner" aria-hidden="true" /> : <PasskeyMark />}
            <span>Passkey</span>
          </button>
        )}
      </div>
      <div className="cc-or" role="separator">
        <span>or</span>
      </div>
    </>
  );
}

export type Method = "password" | "email" | "sms";

export function MethodTabs({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  const tabs: [Method, string][] = [
    ["password", "Password"],
    ["email", "Email code"],
    ["sms", "Phone"],
  ];
  return (
    <div className="cc-tabs" role="tablist" aria-label="Sign-in method" style={{ "--i": tabs.findIndex(([m]) => m === value) } as React.CSSProperties}>
      <span className="cc-tabs-thumb" aria-hidden="true" />
      {tabs.map(([m, label]) => (
        <button key={m} type="button" role="tab" aria-selected={value === m} className="cc-tab" onClick={() => onChange(m)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Six digit boxes over one real input, so paste, autofill (one-time-code) and screen readers all work. */
function CodeInput({ value, onChange, onComplete, disabled }: { value: string; onChange: (v: string) => void; onComplete: (v: string) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => input.current?.focus(), []);
  return (
    <div className="cc-code" onClick={() => input.current?.focus()}>
      <input
        ref={input}
        className="cc-code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit code"
        maxLength={6}
        value={value}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          onChange(v);
          if (v.length === 6) onComplete(v);
        }}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="cc-code-box" data-filled={value[i] ? true : undefined} data-active={focused && i === Math.min(value.length, 5) ? true : undefined} aria-hidden="true">
          {value[i] ?? ""}
        </span>
      ))}
    </div>
  );
}

/** One-time code by email or SMS: ask for the address, then the 6 digits. */
export function CodeSignIn({ channel, run }: { channel: "email" | "sms"; run: RunLogin }) {
  const { refresh } = useAuth();
  const stage = useStage();
  const [dest, setDest] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  const payload = (to: string) => (channel === "email" ? { channel, email: to } : { channel, phone: to });

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const to = channel === "email" ? dest.trim() : dest.replace(/\D/g, "").slice(-10);
    if (channel === "email" && !/^\S+@\S+\.\S+$/.test(to)) return setFieldError("Enter a valid email address.");
    if (channel === "sms" && !/^[6-9]\d{9}$/.test(to)) return setFieldError("Enter a valid 10-digit mobile number.");
    setFieldError(undefined);
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/code/start", payload(to));
      setSentTo(to);
      setCode("");
      setWait(30);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.fields) setFieldError(err.fields.email ?? err.fields.phone);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (digits = code) => {
    if (!sentTo || digits.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await run(async () => {
        const r = await api.post<{ user: Me }>("/auth/code/verify", { ...payload(sentTo), code: digits });
        await refresh();
        return r.user;
      });
    } catch (err) {
      setBusy(false);
      setCode("");
      setError(errorMessage(err));
      stage.fail();
    }
  };

  if (!sentTo) {
    return (
      <form className="stack" onSubmit={send} noValidate>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {channel === "email" ? (
          <TextField label="Email" type="email" autoComplete="email" required value={dest} onChange={(e) => setDest(e.target.value)} error={fieldError} />
        ) : (
          <TextField label="Mobile number (+91)" type="tel" inputMode="numeric" autoComplete="tel-national" required value={dest} onChange={(e) => setDest(e.target.value)} error={fieldError} placeholder="98765 43210" />
        )}
        <Button className="btn-lg btn-block" loading={busy} type="submit">
          Send code
        </Button>
        <p className="tiny muted" style={{ textAlign: "center", margin: 0 }}>
          {channel === "email" ? "We'll email you a 6-digit code. No password needed." : "Works with the mobile number saved on your account."}
        </p>
      </form>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
      noValidate
    >
      <p className="small" style={{ margin: 0, color: "var(--text-2)" }}>
        If there's an account for <strong style={{ color: "#fff" }}>{channel === "sms" ? `+91 ${sentTo}` : sentTo}</strong>, a code is on its way. It expires in 10 minutes.
      </p>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <CodeInput value={code} onChange={setCode} onComplete={verify} disabled={busy} />
      <Button className="btn-lg btn-block" loading={busy} type="submit" disabled={code.length !== 6}>
        Sign in
      </Button>
      <div className="spread small">
        <button type="button" className="link" onClick={() => (setSentTo(null), setError(null))}>
          ← Change {channel === "email" ? "email" : "number"}
        </button>
        <button type="button" className="link" disabled={wait > 0 || busy} onClick={() => send()}>
          {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
