import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import Schedule from "./pages/Schedule";
import RodeoDetail from "./pages/RodeoDetail";
import Performance from "./pages/Performance";
import Analytics from "./pages/Analytics";
import Locations from "./pages/Locations";
import Settings from "./pages/Settings";
import Home from "./pages/Home";
import {
  CalendarDays,
  Trophy,
  BarChart3,
  MapPin,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "./lib/utils";

const NAV_ITEMS = [
  { path: "/schedule", label: "Schedule", icon: CalendarDays },
  { path: "/performance", label: "Runs", icon: Trophy },
  { path: "/analytics", label: "Progress", icon: BarChart3 },
  { path: "/locations", label: "Map", icon: MapPin },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location === path || location.startsWith(path + "/");
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("w-5 h-5", active && "stroke-[2.5]")}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-bottom" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}

function AppShell() {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading Rodeo Companion…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  const isHome = location === "/";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Switch>
        <Route path="/" component={Schedule} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/schedule/:id" component={RodeoDetail} />
        <Route path="/performance" component={Performance} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/locations" component={Locations} />
        <Route path="/settings" component={Settings} />
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppShell />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
