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
import {
  CalendarDays,
  Trophy,
  BarChart3,
  MapPin,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from "lucide-react";
import { cn } from "./lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: HomeIcon, exact: true },
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/performance", label: "Runs", icon: Trophy },
  { path: "/analytics", label: "Progress", icon: BarChart3 },
  { path: "/locations", label: "Map", icon: MapPin },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: "linear-gradient(180deg, oklch(0.14 0.04 45) 0%, oklch(0.11 0.03 44) 100%)",
        borderTopColor: "oklch(0.72 0.16 75 / 30%)",
        boxShadow: "0 -4px 24px oklch(0 0 0 / 60%), 0 -1px 0 oklch(0.72 0.16 75 / 15%)",
      }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
          const active = exact ? location === path : (location === path || location.startsWith(path + "/"));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 px-1 text-xs font-semibold transition-all duration-200",
                active ? "nav-active" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-all", active && "scale-110")} />
              <span className={cn("transition-all", active && "font-bold")}>{label}</span>
              {active && (
                <span
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.16 75)", boxShadow: "0 0 8px oklch(0.72 0.16 75)" }}
                />
              )}
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
