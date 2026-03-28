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
import Contacts from "./pages/Contacts";
import BrowseEvents from "./pages/BrowseEvents";
import {
  CalendarDays,
  Trophy,
  BarChart3,
  MapPin,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Users,
} from "lucide-react";
import { cn } from "./lib/utils";

// Custom horse icon as SVG component
function HorseNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 3c-1 0-2 .5-2.5 1.5L15 7l-2-1-1.5 1.5L10 6l-2 1-1 3H5l-1 2 2 1v3l2 2h2l1-2h4l1 2h2l2-2v-3l2-1-1-2h-2l-1-3z" />
      <circle cx="8" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: HomeIcon, exact: true },
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/performance", label: "Runs", icon: Trophy },
  { path: "/analytics", label: "Progress", icon: BarChart3 },
  { path: "/locations", label: "Map", icon: MapPin },
  { path: "/horses", label: "Horses", icon: HorseNavIcon },
  { path: "/contacts", label: "Contacts", icon: Users },
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
        <Route path="/" component={Dashboard} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/schedule/:id" component={RodeoDetail} />
        <Route path="/performance" component={Performance} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/locations" component={Locations} />
        <Route path="/settings" component={Settings} />
        <Route path="/horses" component={Horses} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/browse-events" component={BrowseEvents} />
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
