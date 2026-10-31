import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api, errorMessage } from "../../lib/api";
import { landingAfterSignIn, useAuth, type Me } from "../../lib/auth";
import { safeReturnTo } from "../../lib/format";
import { Button, PasswordField, TextField } from "../../components/ui";
import { ServiceAreaFields, emptyServiceArea, serviceAreaError } from "../../components/ServiceAreaFields";
import { AuthStage, useStage } from "./AuthStage";
import { CodeSignIn, MethodTabs, SocialSignIn, type Method } from "./SignInMethods";
import { greeting } from "./stageBus";

type Mode = "signin" | "register" | "forgot" | "reset" | "verify" | "invite";

function FormError({ error }: { error: string | null }) {
  return error ? (
    <div className="alert alert-danger" role="alert">
      {error}
    </div>
  ) : null;
}

/** Shared finish for every sign-in method: celebrate on the stage, then go where the visitor was heading. */
function useFinishLogin(fallback?: string) {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"), "");
  const { user } = useAuth();
  const navigate = useNavigate();
  const stage = useStage();
  const finishing = useRef(false);

  // Already signed in when the page opened: skip straight on.
  useEffect(() => {
    if (user && !finishing.current) navigate(landingAfterSignIn(user, returnTo), { replace: true });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (login: () => Promise<Me>) => {
    finishing.current = true;
    try {
      const u = await login();
      await stage.celebrate();
      // New sign-ups keep their welcome page; sign-ins open on their role's first page.
      navigate(fallback && !returnTo ? fallback : landingAfterSignIn(u, returnTo), { replace: true });
    } catch (e) {
      finishing.current = false;
      throw e;
    }
  };
  return { run, returnTo, params };
}

function SignIn() {
  const { run, returnTo, params } = useFinishLogin();
  const fromCart = params.get("reason") === "cart";
  const { signIn } = useAuth();
  const stage = useStage();
  const [method, setMethod] = useState<Method>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [fields, setFields] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      await run(() => signIn(email, password));
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFields(err.fields);
      setBusy(false);
      stage.fail();
    }
  };

  const qs = params.toString() ? `?${params.toString()}` : "";
  return (
    <AuthStage title="Sign in" subtitle={fromCart ? "Sign in or create an account to add this item to your bag. We'll add it as soon as you're in." : `${greeting()}. Welcome back to CrownCart.`}>
      <SocialSignIn returnTo={returnTo} run={run} onError={setError} />
      <MethodTabs value={method} onChange={(m) => (setMethod(m), setError(null))} />
      {method === "password" ? (
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
      ) : (
        <>
          {error && <FormError error={error} />}
          <CodeSignIn key={method} channel={method} run={run} />
        </>
      )}
      <p className="small muted" style={{ textAlign: "center", margin: 0 }}>
        New to CrownCart? <Link to={`/register${qs}`}>Create an account</Link>
      </p>
    </AuthStage>
  );
}

function Register() {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"), "");
  const { register } = useAuth();
  const { run } = useFinishLogin("/account?welcome=1");
  const stage = useStage();
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
    if (Object.keys(local).length) return stage.fail();
    setBusy(true);
    setError(null);
    try {
      let referralCode: string | null = null;
      try {
        referralCode = sessionStorage.getItem("cc-ref");
      } catch {
        /* ignore */
      }
      await run(() => register({ ...form, referralCode }));
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFields(err.fields);
      setBusy(false);
      stage.fail();
    }
  };

  const qs = params.toString() ? `?${params.toString()}` : "";
  return (
    <AuthStage title="Create account" subtitle="Save your bag across devices, track orders and check out faster.">
      <SocialSignIn returnTo={returnTo} />
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
    </AuthStage>
  );
}

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthStage title="Reset your password" subtitle="Enter your account email and we'll send you a reset link.">
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
    </AuthStage>
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
    <AuthStage title="Choose a new password">
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
    </AuthStage>
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
    <AuthStage title="Email verification">
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
    </AuthStage>
  );
}

/** Where a joining delivery partner works; used for nearby auto-assignment. */
function PartnerArea({ area, setArea }: { area: typeof emptyServiceArea; setArea: (a: typeof emptyServiceArea) => void }) {
  return (
    <fieldset className="stack" style={{ border: 0, padding: 0, margin: "6px 0 0" }}>
      <legend className="h3" style={{ marginBottom: 4 }}>
        Where you deliver
      </legend>
      <p className="tiny muted" style={{ marginTop: 0 }}>
        Orders going to these PIN codes are sent to you automatically.
      </p>
      <ServiceAreaFields value={area} onChange={setArea} />
    </fieldset>
  );
}

function Invite() {
  const { token = "" } = useParams();
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState<{ email: string; role: string; memberRole: string | null; storeName: string | null; existingAccount: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [area, setArea] = useState(emptyServiceArea);
  const [busy, setBusy] = useState(false);
  const isPartner = info?.role === "delivery_partner";
  useEffect(() => {
    api.get<typeof info>(`/auth/invitations/${encodeURIComponent(token)}`).then(setInfo).catch((e) => setError(errorMessage(e)));
  }, [token]);
  const roleName = info ? (info.memberRole && info.memberRole !== "owner" ? info.memberRole.replace(/_/g, " ") : info.role.replace(/_/g, " ")) : "";
  const accept = async (e?: FormEvent) => {
    e?.preventDefault();
    const areaErr = isPartner ? serviceAreaError(area) : null;
    if (areaErr) return setError(areaErr);
    setBusy(true);
    setError(null);
    try {
      await api.post(`/auth/invitations/${encodeURIComponent(token)}/accept`, {
        ...(info?.existingAccount ? {} : form),
        ...(isPartner ? { serviceArea: { city: area.city.trim(), state: area.state, pincodes: area.pincodes } } : {}),
      });
      await refresh();
      navigate(isPartner ? "/delivery" : "/account", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthStage title="Accept invitation" subtitle={info ? `You've been invited to join CrownCart as ${roleName}${info.storeName ? ` for ${info.storeName}` : ""}.` : undefined}>
      <FormError error={error} />
      {info &&
        (info.existingAccount ? (
          user?.email === info.email ? (
            <form className="stack" onSubmit={accept}>
              {isPartner && <PartnerArea area={area} setArea={setArea} />}
              <Button className="btn-lg btn-block" loading={busy} type="submit">
                Accept as {info.email}
              </Button>
            </form>
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
            {isPartner && <PartnerArea area={area} setArea={setArea} />}
            <Button className="btn-lg btn-block" loading={busy} type="submit">
              Create account & accept
            </Button>
          </form>
        ))}
    </AuthStage>
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
