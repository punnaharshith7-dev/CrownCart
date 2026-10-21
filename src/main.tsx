import { createRoot } from "react-dom/client";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth, type Role } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { Loading, Empty } from "./components/ui";
import { StoreLayout } from "./components/SiteHeader";
import "./styles.css";
import "./styles/app.css";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/shop/Shop"));
const Product = lazy(() => import("./pages/shop/Product"));
const Cart = lazy(() => import("./pages/shop/Cart"));
const Checkout = lazy(() => import("./pages/shop/Checkout"));
const OrderPlaced = lazy(() => import("./pages/shop/OrderPlaced"));
const AuthPages = lazy(() => import("./pages/auth/AuthPages"));
const Account = lazy(() => import("./pages/account/Account"));
const Owner = lazy(() => import("./pages/owner/Owner"));
const Admin = lazy(() => import("./pages/admin/Admin"));
const Delivery = lazy(() => import("./pages/delivery/Delivery"));
const Info = lazy(() => import("./pages/Info"));

/** Client-side gate for portal UIs. The server enforces every permission independently. */
function RequireAuth({ children, role, test }: { children: ReactNode; role?: Role; test?: (u: NonNullable<ReturnType<typeof useAuth>["user"]>) => boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to={`/signin?returnTo=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if ((role && !user.roles.includes(role)) || (test && !test(user))) {
    return (
      <StoreLayout>
        <Empty title="Access denied">Your account doesn't have access to this area.</Empty>
      </StoreLayout>
    );
  }
  return <>{children}</>;
}

function NotFound() {
  return (
    <StoreLayout>
      <Empty title="Page not found" action={<a className="btn" href="/">Go to CrownCart</a>}>
        The page you're looking for doesn't exist or has moved.
      </Empty>
    </StoreLayout>
  );
}

function Root() {
  const loc = useLocation();
  useEffect(() => {
    const ref = new URLSearchParams(loc.search).get("ref");
    if (ref && /^[A-Za-z0-9]{3,20}$/.test(ref)) {
      try {
        sessionStorage.setItem("cc-ref", ref.toUpperCase());
      } catch {
        /* ignore */
      }
    }
  }, [loc.search]);
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:category" element={<Shop />} />
        <Route path="/collections" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/order-placed/:checkoutId" element={<RequireAuth><OrderPlaced /></RequireAuth>} />
        <Route path="/signin" element={<AuthPages mode="signin" />} />
        <Route path="/register" element={<AuthPages mode="register" />} />
        <Route path="/forgot-password" element={<AuthPages mode="forgot" />} />
        <Route path="/reset-password" element={<AuthPages mode="reset" />} />
        <Route path="/verify-email" element={<AuthPages mode="verify" />} />
        <Route path="/invite/:token" element={<AuthPages mode="invite" />} />
        <Route path="/account/*" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="/owner/*" element={<RequireAuth test={(u) => u.stores.length > 0}><Owner /></RequireAuth>} />
        <Route path="/admin/*" element={<RequireAuth test={(u) => u.permissions.length > 0}><Admin /></RequireAuth>} />
        <Route path="/delivery/*" element={<RequireAuth role="delivery_partner"><Delivery /></RequireAuth>} />
        <Route path="/contact" element={<Info page="contact" />} />
        <Route path="/policies/:policy" element={<Info page="policy" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
