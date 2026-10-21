import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api, errorMessage } from "../../lib/api";
import { homeFor, useAuth } from "../../lib/auth";
import { safeReturnTo } from "../../lib/format";
import { useTitle } from "../../lib/useApi";
import { Button, PasswordField, TextField } from "../../components/ui";

type Mode = "signin" | "register" | "forgot" | "reset" | "verify" | "invite";

function Shell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  useTitle(title, { noindex: true });
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="auth-shell">
        <div className="auth-art" style={{ backgroundImage: "url(/products/jordan_bg_hd.png)" }} aria-hidden="true">
          <Link to="/" className="wordmark" style={{ color: "#fff" }} tabIndex={-1}>
            CrownCart
          </Link>
          <div>
            <div className="display" style={{ color: "#fff" }}>
              Beyond Ordinary.
            </div>
            <p style={{ opacity: 0.75, marginTop: 8 }}>Discover a world of extraordinary choices.</p>
          </div>
        </div>
        <main id="main" className="auth-panel">
          <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }} className="stack">
            <Link to="/" className="wordmark" style={{ fontSize: 26 }}>
              CrownCart
            </Link>
            <div>
              <h1 className="h2">{title}</h1>
              {subtitle && <p className="muted small" style={{ marginTop: 6 }}>{subtitle}</p>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  return error ? (
    <div className="alert alert-danger" role="alert">
      {error}
    </div>
  ) : null;
}

function GoogleButton({ returnTo }: { returnTo: string }) {
  const { googleEnabled } = useAuth();
  if (!googleEnabled) return null;
  return (
    <>
      <a className="btn btn-outline btn-lg btn-block" href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo || "/")}`}>
        <span aria-hidden="true" style={{ fontWeight: 800 }}>
          G
        </span>{" "}
        Continue with Google
      </a>
      <div className="row tiny muted" style={{ justifyContent: "center" }}>
        <span>or use your email</span>
      </div>
    </>
  );
}

function SignIn() {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"), "");
  const fromCart = params.get("reason") === "cart";
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !busy) navigate(returnTo || homeFor(user), { replace: true });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const u = await signIn(email, password);
      navigate(returnTo || homeFor(u), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFields(err.fields);
      setBusy(false);
    }
  };

  const qs = params.toString() ? `?${params.toString()}` : "";
  return (
    <Shell title="Sign in" subtitle={fromCart ? "Sign in or create an account to add this item to your bag. We'll add it as soon as you're in." : "Welcome back to CrownCart."}>
      <GoogleButton returnTo={returnTo} />
      <form className="stack" onSubmit={submit} noValidate>
        <FormError error={error} />
        <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} />
        <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} />
        <div className="spread small">
          <span />
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button className="btn-lg btn-block" loading={busy} type="submit">
          Sign in
        </Button>
      </form>
      <p className="small muted" style={{ textAlign: "center" }}>
        New to CrownCart? <Link to={`/register${qs}`}>Create an account</Link>
      </p>
    </Shell>
  );
}

function Register() {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"), "");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", acceptTerms: false, marketingOptIn: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (form.name.trim().length < 2) local.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = "Enter a valid email address.";
    if (form.password.length < 10) local.password = "Use at least 10 characters.";
    if (!form.acceptTerms) local.acceptTerms = "Please accept the terms to continue.";
    setFields(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate(returnTo || "/account?welcome=1", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFields(err.fields);
      setBusy(false);
    }
  };

  const qs = params.toString() ? `?${params.toString()}` : "";
  return (
    <Shell title="Create your account" subtitle="Save your bag across devices, track orders and check out faster.">
      <GoogleButton returnTo={returnTo} />
      <form className="stack" onSubmit={submit} noValidate>
        <FormError error={error} />
        <TextField label="Full name" autoComplete="name" required value={form.name} onChange={set("name")} error={fields.name} />
        <TextField label="Email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fields.email} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          required
          showStrength
          value={form.password}
          onChange={set("password")}
          error={fields.password}
          hint="At least 10 characters. A short phrase is easier to remember and harder to guess."
        />
        <label className="check">
          <input type="checkbox" checked={form.acceptTerms} onChange={set("acceptTerms")} aria-invalid={fields.acceptTerms ? true : undefined} />
          <span>
            I agree to the <Link to="/policies/terms" target="_blank">terms</Link> and have read the <Link to="/policies/privacy" target="_blank">privacy policy</Link>.
          </span>
        </label>
        {fields.acceptTerms && <span className="field-error">{fields.acceptTerms}</span>}
        <label className="check">
          <input type="checkbox" checked={form.marketingOptIn} onChange={set("marketingOptIn")} />
          <span>Email me about new arrivals and offers. You can unsubscribe any time.</span>
        </label>
        <Button className="btn-lg btn-block" loading={busy} type="submit">
          Create account
        </Button>
      </form>
      <p className="small muted" style={{ textAlign: "center" }}>
        Already have an account? <Link to={`/signin${qs}`}>Sign in</Link>
      </p>
    </Shell>
  );
}

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Shell title="Reset your password" subtitle="Enter your account email and we'll send you a reset link.">
      {sent ? (
        <div className="alert alert-success" role="status">
          If an account exists for {email}, a reset link is on its way. The link expires in 30 minutes.
        </div>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api.post("/auth/forgot-password", { email });
              setSent(true);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <FormError error={error} />
          <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="btn-lg btn-block" loading={busy} type="submit">
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/signin" className="small">
        ← Back to sign in
      </Link>
    </Shell>
  );
}

function Reset() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Shell title="Choose a new password">
      {done ? (
        <>
          <div className="alert alert-success" role="status">
            Your password was changed and other sessions were signed out.
          </div>
          <Link className="btn btn-block" to="/signin">
            Sign in
          </Link>
        </>
      ) : !token ? (
        <div className="alert alert-danger">This reset link is incomplete. Request a new one.</div>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api.post("/auth/reset-password", { token, password });
              setDone(true);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <FormError error={error} />
          <PasswordField label="New password" autoComplete="new-password" required showStrength value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button className="btn-lg btn-block" loading={busy} type="submit">
            Save password
          </Button>
        </form>
      )}
      <Link to="/forgot-password" className="small">
        Request a new link
      </Link>
    </Shell>
  );
}

function Verify() {
  const [params] = useSearchParams();
  const { refresh, user } = useAuth();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [error, setError] = useState("");
  useEffect(() => {
    const token = params.get("token");
    if (!token) return (setState("error"), setError("This verification link is incomplete."));
    api
      .post("/auth/verify-email", { token })
      .then(() => (setState("done"), refresh()))
      .catch((e) => (setState("error"), setError(errorMessage(e))));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell title="Email verification">
      {state === "working" && <p className="muted">Verifying…</p>}
      {state === "done" && (
        <>
          <div className="alert alert-success">Your email is verified. You can now place orders.</div>
          <Link className="btn btn-block" to={user ? "/cart" : "/signin"}>
            Continue
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <div className="alert alert-danger">{error}</div>
          {user && (
            <Button className="btn-outline" onClick={() => api.post("/auth/resend-verification").then(() => setError("A new link has been sent to your email."))}>
              Send a new link
            </Button>
          )}
        </>
      )}
    </Shell>
  );
}

function Invite() {
  const { token = "" } = useParams();
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ email: string; role: string; memberRole: string | null; storeName: string | null; existingAccount: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get<typeof info>(`/auth/invitations/${encodeURIComponent(token)}`).then(setInfo).catch((e) => setError(errorMessage(e)));
  }, [token]);
  const roleName = info ? (info.memberRole && info.memberRole !== "owner" ? info.memberRole.replace(/_/g, " ") : info.role.replace(/_/g, " ")) : "";
  const accept = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/auth/invitations/${encodeURIComponent(token)}/accept`, info?.existingAccount ? {} : form);
      await refresh();
      navigate("/account", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="Accept invitation" subtitle={info ? `You've been invited to join CrownCart as ${roleName}${info.storeName ? ` for ${info.storeName}` : ""}.` : undefined}>
      <FormError error={error} />
      {info &&
        (info.existingAccount ? (
          user?.email === info.email ? (
            <Button className="btn-lg btn-block" loading={busy} onClick={() => accept()}>
              Accept as {info.email}
            </Button>
          ) : (
            <Link className="btn btn-block" to={`/signin?returnTo=${encodeURIComponent(`/invite/${token}`)}`}>
              Sign in as {info.email} to accept
            </Link>
          )
        ) : (
          <form className="stack" onSubmit={accept}>
            <TextField label="Email" value={info.email} disabled readOnly />
            <TextField label="Full name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <PasswordField label="Password" autoComplete="new-password" required showStrength value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button className="btn-lg btn-block" loading={busy} type="submit">
              Create account & accept
            </Button>
          </form>
        ))}
    </Shell>
  );
}

export default function AuthPages({ mode }: { mode: Mode }) {
  switch (mode) {
    case "signin":
      return <SignIn />;
    case "register":
      return <Register />;
    case "forgot":
      return <Forgot />;
    case "reset":
      return <Reset />;
    case "verify":
      return <Verify />;
    case "invite":
      return <Invite />;
  }
}
