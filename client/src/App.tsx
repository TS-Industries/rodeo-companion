import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Schedule from "./pages/Schedule";
import RodeoDetail from "./pages/RodeoDetail";
import Performance from "./pages/Performance";
import Analytics from "./pages/Analytics";
import Locations from "./pages/Locations";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Horses from "./pages/Horses";
import BrowseEvents from "./pages/BrowseEvents";
import Upgrade from "./pages/Upgrade";
import {
  CalendarDays,
  Trophy,
  BarChart3,
  MapPin,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from "lucide-react";
import { cn } from "./lib/utils";

// Clean horse silhouette nav icon
function HorseNavIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Horse side profile silhouette — galloping pose */}
      <path d="M52 8c-2 0-3.5 1-4.5 2.5L45 14l-3-1.5c-.8-.4-1.7-.4-2.5 0L37 14l-2-3C34 9.2 32.2 8 30 8c-3 0-5.5 1.8-6.5 4.5l-.5 1.5-4-1C16 12.2 13 14.5 12.5 17.5L11.5 22H9C7.3 22 6 23.3 6 25v2c0 1.7 1.3 3 3 3h1.5v5L8 42c-.4 1.4.4 2.8 1.8 3.2 1.4.4 2.8-.4 3.2-1.8L15 37h1.5v7c0 1.7 1.3 3 3 3s3-1.3 3-3v-7h9v7c0 1.7 1.3 3 3 3s3-1.3 3-3v-7l4 1v6c0 1.7 1.3 3 3 3s3-1.3 3-3v-7l2-2c1.2-1.2 2-2.8 2-4.5V27c0-1.5-.5-3-1.5-4L49 20l2.5-2.5c.8-.8 1.5-2 1.5-3.5V11c0-1.7-1.3-3-3-3zm-16 10c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
    </svg>
  );
}

function PageErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "oklch(0.72 0.16 75 / 15%)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
        <span className="text-2xl">🐴</span>
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.82 0.18 80)" }}>
        Something went wrong
      </h2>
      <p className="text-sm mb-5" style={{ color: "oklch(0.55 0.06 60)" }}>
        Pull to refresh or tap below to reload.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
        style={{ background: "oklch(0.72 0.16 75)", color: "oklch(0.15 0.04 48)" }}
      >
        Reload Page
      </button>
    </div>
  );
}

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: HomeIcon, exact: true },
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/performance", label: "Runs", icon: Trophy },
  { path: "/analytics", label: "Progress", icon: BarChart3 },
  { path: "/locations", label: "Map", icon: MapPin },
  { path: "/horses", label: "Horses", icon: HorseNavIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, oklch(0.13 0.05 46 / 96%) 0%, oklch(0.10 0.04 44 / 98%) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid oklch(0.72 0.16 75 / 20%)",
        boxShadow: "0 -8px 32px oklch(0 0 0 / 60%), 0 -1px 0 oklch(0.72 0.16 75 / 10%)",
      }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto px-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
          const active = exact ? location === path : (location === path || location.startsWith(path + "/"));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-0.5 text-[10px] font-semibold transition-all duration-200 relative"
              style={{ color: active ? "oklch(0.82 0.18 80)" : "oklch(0.45 0.04 60)" }}
            >
              {/* Active glow pill background */}
              {active && (
                <span
                  className="absolute inset-x-1 inset-y-1 rounded-xl pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.16 75 / 18%), oklch(0.65 0.14 70 / 12%))",
                    boxShadow: "0 0 12px oklch(0.72 0.16 75 / 25%)",
                    border: "1px solid oklch(0.72 0.16 75 / 20%)",
                  }}
                />
              )}
              <Icon
                className="relative z-10 transition-all duration-200"
                style={{
                  width: active ? "1.35rem" : "1.2rem",
                  height: active ? "1.35rem" : "1.2rem",
                  filter: active ? "drop-shadow(0 0 6px oklch(0.72 0.16 75 / 70%))" : "none",
                }}
              />
              <span
                className="relative z-10 transition-all duration-200"
                style={{
                  fontFamily: active ? "'Cinzel', serif" : "'Inter', sans-serif",
                  fontSize: active ? "0.6rem" : "0.6rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: active ? "0.05em" : "0",
                  textShadow: active ? "0 0 8px oklch(0.72 0.16 75 / 50%)" : "none",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}

function AppShell() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, oklch(0.12 0.04 45), oklch(0.18 0.05 50))" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl animate-bounce">🤠</div>
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "oklch(0.72 0.16 75)", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "oklch(0.72 0.16 75)" }}>
            Saddling up…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Switch>
        <Route path="/"><ErrorBoundary fallback={<PageErrorFallback />}><Dashboard /></ErrorBoundary></Route>
        <Route path="/schedule"><ErrorBoundary fallback={<PageErrorFallback />}><Schedule /></ErrorBoundary></Route>
        <Route path="/schedule/:id" component={RodeoDetail} />
        <Route path="/performance"><ErrorBoundary fallback={<PageErrorFallback />}><Performance /></ErrorBoundary></Route>
        <Route path="/analytics"><ErrorBoundary fallback={<PageErrorFallback />}><Analytics /></ErrorBoundary></Route>
        <Route path="/locations" component={Locations} />
        <Route path="/settings" component={Settings} />
        <Route path="/horses" component={Horses} />
        <Route path="/browse-events"><ErrorBoundary fallback={<PageErrorFallback />}><BrowseEvents /></ErrorBoundary></Route>
        <Route path="/upgrade" component={Upgrade} />
        <Route path="/help" component={Help} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.20 0.05 48)",
                border: "1px solid oklch(0.72 0.16 75 / 40%)",
                color: "oklch(0.93 0.03 75)",
              },
            }}
          />
          <AppShell />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
