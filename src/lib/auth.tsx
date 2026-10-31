import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api, newRequestId } from "./api";
import { playFeedback } from "./feedback";
import { useToast } from "./toast";

export type Role = "customer" | "store_owner" | "platform_admin" | "delivery_partner";

export interface Me {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  roles: Role[];
  permissions: string[];
  stores: { id: number; name: string; slug: string; status: string; role: string }[];
  deliveryPartner: { status: string; availability: string } | null;
  /** A new account that hasn't saved or skipped the "tell us about you" step. */
  needsProfile?: boolean;
}

interface MeResponse {
  user: Me | null;
  cartCount: number;
  unreadNotifications: number;
  preferences: Record<string, any> | null;
  integrations?: { google: boolean; microsoft?: boolean };
}

interface PendingAdd {
  variantId: number;
  quantity: number;
  requestId: string;
  returnTo: string;
  productName?: string;
}

interface AuthState {
  user: Me | null;
  loading: boolean;
  cartCount: number;
  unread: number;
  preferences: Record<string, any> | null;
  googleEnabled: boolean;
  microsoftEnabled: boolean;
  refresh: () => Promise<void>;
  setCartCount: (n: number) => void;
  signIn: (email: string, password: string) => Promise<Me>;
  register: (input: { name: string; email: string; password: string; acceptTerms: boolean; marketingOptIn: boolean; referralCode?: string | null }) => Promise<Me>;
  signOut: () => Promise<void>;
  /** Adds to the bag, sending a signed-out visitor to Sign In first and finishing the add afterwards. */
  addToCart: (variantId: number, quantity: number, opts?: { productName?: string; returnTo?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthState>(null!);
const PENDING_KEY = "cc-pending-add";

// sessionStorage only remembers *what* to add; the server re-validates product, price and stock.
const savePending = (p: PendingAdd) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    /* without storage the visitor simply adds again after signing in */
  }
};
const takePending = (): PendingAdd | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function homeFor(user: Me | null) {
  if (!user) return "/";
  if (user.roles.includes("platform_admin")) return "/admin";
  if (user.stores.length) return "/owner";
  if (user.roles.includes("delivery_partner")) return "/delivery";
  return "/account";
}

/**
 * Where to land right after signing in. A real destination the visitor was heading to (a product,
 * the bag, an invite…) wins; otherwise each role opens on its first page: admins on the dashboard,
 * store owners on their store, partners on deliveries, and customers in the shop. Everyone can
 * still reach My account from the menu.
 */
export function landingAfterSignIn(user: Me, returnTo = "") {
  const path = returnTo.split(/[?#]/)[0];
  const generic = !path || path === "/" || path === "/signin" || path === "/account";
  if (!generic) return returnTo;
  const home = homeFor(user);
  return home === "/account" ? "/shop" : home;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MeResponse>({ user: null, cartCount: 0, unreadNotifications: 0, preferences: null });
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const replaying = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setState(await api.get<MeResponse>("/auth/me"));
    } catch {
      /* keep the previous state when offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Expired sessions surface as 401s anywhere; re-sync so the UI reflects it.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const doAdd = useCallback(
    async (p: Omit<PendingAdd, "returnTo">) => {
      const r = await api.post<{ duplicate: boolean; productName?: string; cart: { itemCount: number } }>("/cart/items", {
        variantId: p.variantId,
        quantity: p.quantity,
        requestId: p.requestId,
      });
      setState((s) => ({ ...s, cartCount: r.cart.itemCount }));
      toast(`${r.productName ?? p.productName ?? "Item"} added to your bag.`, "success", { label: "View bag", href: "/cart" });
    },
    [toast],
  );

  /** After sign-in, finish the add-to-cart that sent the visitor here. */
  const replayPending = useCallback(async () => {
    if (replaying.current) return;
    const p = takePending();
    if (!p) return;
    replaying.current = true;
    try {
      await doAdd(p);
    } catch (e) {
      toast(e instanceof ApiError ? `We couldn't add that item: ${e.message}` : "We couldn't add that item. Please try again.", "error");
    } finally {
      replaying.current = false;
    }
  }, [doAdd, toast]);

  // Redirect-based sign-in (Google) lands back on the site already signed in:
  // finish any add-to-bag that started the trip.
  useEffect(() => {
    if (state.user) replayPending();
  }, [state.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(
    async (email: string, password: string) => {
      const r = await api.post<{ user: Me }>("/auth/login", { email, password });
      await refresh();
      await replayPending();
      return r.user;
    },
    [refresh, replayPending],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; acceptTerms: boolean; marketingOptIn: boolean; referralCode?: string | null }) => {
      const r = await api.post<{ user: Me }>("/auth/register", input);
      await refresh();
      await replayPending();
      return r.user;
    },
    [refresh, replayPending],
  );

  const signOut = useCallback(async () => {
    await api.post("/auth/logout").catch(() => {});
    setState({ user: null, cartCount: 0, unreadNotifications: 0, preferences: null });
    navigate("/");
  }, [navigate]);

  const addToCart = useCallback(
    async (variantId: number, quantity: number, opts: { productName?: string; returnTo?: string } = {}) => {
      const requestId = newRequestId();
      const returnTo = opts.returnTo ?? window.location.pathname + window.location.search + window.location.hash;
      if (!state.user) {
        savePending({ variantId, quantity, requestId, returnTo, productName: opts.productName });
        navigate(`/signin?returnTo=${encodeURIComponent(returnTo)}&reason=cart`);
        return false;
      }
      try {
        await doAdd({ variantId, quantity, requestId, productName: opts.productName });
        playFeedback();
        return true;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // Session expired between page load and click.
          savePending({ variantId, quantity, requestId, returnTo, productName: opts.productName });
          await refresh();
          navigate(`/signin?returnTo=${encodeURIComponent(returnTo)}&reason=cart`);
          return false;
        }
        toast(e instanceof Error ? e.message : "Couldn't add to bag.", "error");
        return false;
      }
    },
    [state.user, navigate, doAdd, refresh, toast],
  );

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading,
        cartCount: state.cartCount,
        unread: state.unreadNotifications,
        preferences: state.preferences,
        googleEnabled: Boolean(state.integrations?.google),
        microsoftEnabled: Boolean(state.integrations?.microsoft),
        refresh,
        setCartCount: (n) => setState((s) => ({ ...s, cartCount: n })),
        signIn,
        register,
        signOut,
        addToCart,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
