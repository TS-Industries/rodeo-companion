import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { CalendarDays, Trophy, BarChart3, MapPin, Video } from "lucide-react";

const FEATURES = [
  { icon: CalendarDays, label: "Schedule & Deadlines", desc: "Track rodeos with automatic entry deadline reminders" },
  { icon: Trophy, label: "Performance Logging", desc: "Record times, scores, and video for every run" },
  { icon: BarChart3, label: "Progress Analytics", desc: "Weekly, monthly, and yearly charts of your improvement" },
  { icon: MapPin, label: "Rodeo Locations", desc: "Google Maps integration with turn-by-turn directions" },
  { icon: Video, label: "Video Library", desc: "Upload and review your runs to identify improvements" },
];

export default function Home() {
  const { loading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
        style={{
          background: "linear-gradient(160deg, oklch(0.28 0.06 55) 0%, oklch(0.42 0.10 55) 60%, oklch(0.65 0.15 50) 100%)",
        }}
      >
        {/* Decorative rope circle */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, oklch(0.76 0.13 80) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.62 0.10 195) 0%, transparent 50%)"
          }}
        />
        <div className="relative z-10">
          <div className="text-6xl mb-4">🤠</div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Rodeo Companion
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xs">
            Your complete rodeo performance tracker — from jackpots to professional circuits.
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8 shadow-lg"
            onClick={() => (window.location.href = getLoginUrl())}
            disabled={loading}
          >
            Get Started — It's Free
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
          Everything a rodeo competitor needs
        </h2>
        <div className="space-y-4">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Supports all major disciplines: Barrel Racing, Breakaway Roping, Team Roping, Tie Down Roping, Bareback, Saddle Bronc & Steer Wrestling.
          </p>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In to Start Tracking
          </Button>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        Rodeo Companion · Built for competitors, by competitors
      </footer>
    </div>
  );
}
