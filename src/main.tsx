import { createRoot } from "react-dom/client";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { usePageCurtain } from "./components/PageCurtain";
import { AuthProvider, useAuth, type Role } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { ProfilePrompt } from "./components/ProfileDetails";
import { Loading, Empty } from "./components/ui";
import { StoreLayout } from "./components/SiteHeader";
import { VelocitySquish } from "./components/VelocitySquish";
import "./styles.css";
import "./styles/app.css";
import "./styles/shopkit.css";
import "./styles/luxe.css";
import { Flair } from "./components/Flair";
import { QuickView } from "./components/QuickView";
import { BagDrawer } from "./components/BagDrawer";
import { IntroReveal } from "./components/IntroReveal";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/shop/Shop"));
const Collections = lazy(() => import("./pages/Collections"));
const BrandShowcase = lazy(() => import("./pages/BrandShowcase"));
const Explore = lazy(() => import("./pages/Explore"));
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
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
  // Every page change washes the old page away; the routes render the location the water has caught up to.
  const shown = usePageCurtain(loc);
  return (
    <Suspense fallback={<Loading />}>
      <Routes location={shown}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:category" element={<Shop />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:brand" element={<BrandShowcase />} />
        <Route path="/explore" element={<Explore />} />
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
        <Route path="/assistant" element={<RequireAuth><AssistantPage /></RequireAuth>} />
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
          <ProfilePrompt />
          <VelocitySquish />
          <Flair />
          <QuickView />
          <BagDrawer />
          <IntroReveal />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
