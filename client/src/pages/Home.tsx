import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { CalendarDays, Trophy, BarChart3, MapPin, Video, Star } from "lucide-react";

const FEATURES = [
  { icon: CalendarDays, label: "Schedule & Deadlines", desc: "Track rodeos with automatic entry deadline reminders sent straight to your phone." },
  { icon: Trophy, label: "Performance Logging", desc: "Record times, scores, and video for every run across all disciplines." },
  { icon: BarChart3, label: "Progress Analytics", desc: "Weekly, monthly, and yearly charts to visualize your improvement over time." },
  { icon: MapPin, label: "Rodeo Locations + Fuel", desc: "Multi-stop route planner with fuel stations along the way and trip cost estimates." },
  { icon: Video, label: "Video Library", desc: "Upload and review your runs to spot what to fix and celebrate your best rides." },
];

const DISCIPLINES = [
  "🐎 Barrel Racing", "🪢 Breakaway Roping", "🤠 Team Roping",
  "🐂 Tie Down Roping", "🤠 Bareback", "🐴 Saddle Bronc", "💪 Steer Wrestling",
];

export default function Home() {
  const { loading } = useAuth();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, oklch(0.11 0.04 44) 0%, oklch(0.14 0.04 46) 100%)" }}
    >
      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-6 py-16 text-center">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: "oklch(0.72 0.16 75)" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-15"
            style={{ background: "oklch(0.55 0.20 25)" }}
          />
        </div>

        {/* Star row */}
        <div className="flex justify-center gap-3 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 fill-current"
              style={{ color: "oklch(0.72 0.16 75)", filter: "drop-shadow(0 0 6px oklch(0.72 0.16 75 / 80%))" }}
            />
          ))}
        </div>

        <div className="text-7xl mb-4 drop-shadow-lg">🤠</div>

        <h1
          className="text-5xl font-bold mb-3 leading-tight"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "oklch(0.78 0.18 80)",
            textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%), 0 0 60px oklch(0.72 0.16 75 / 25%)",
          }}
        >
          Rodeo
          <br />
          Companion
        </h1>

        <div className="star-divider max-w-xs mx-auto mb-4">
          <span>Your Complete Rodeo Tracker</span>
        </div>

        <p className="text-base mb-8 max-w-xs mx-auto leading-relaxed" style={{ color: "oklch(0.72 0.06 65)" }}>
          From jackpots to professional circuits — schedule, track, analyze, and improve your rodeo performance.
        </p>

        <Button
          size="lg"
          className="btn-gold px-10 py-3 text-base rounded-full"
          onClick={() => (window.location.href = getLoginUrl())}
          disabled={loading}
        >
          ★ Get Started Free ★
        </Button>

        <p className="mt-3 text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
          No credit card required
        </p>
      </div>

      {/* ── Disciplines strip ── */}
      <div
        className="py-4 overflow-x-auto scrollbar-hide"
        style={{ borderTop: "1px solid oklch(0.72 0.16 75 / 20%)", borderBottom: "1px solid oklch(0.72 0.16 75 / 20%)" }}
      >
        <div className="flex gap-3 px-6 w-max">
          {DISCIPLINES.map((d) => (
            <span
              key={d}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.20 0.05 48)",
                border: "1px solid oklch(0.72 0.16 75 / 30%)",
                color: "oklch(0.78 0.18 80)",
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <h2
          className="text-xl font-bold text-center mb-6"
          style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}
        >
          Everything a competitor needs
        </h2>

        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-4 p-4 rounded-xl card-western"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.16 75 / 20%), oklch(0.72 0.16 75 / 10%))",
                  border: "1px solid oklch(0.72 0.16 75 / 30%)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "oklch(0.78 0.18 80)" }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "oklch(0.93 0.03 75)" }}>{label}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(0.62 0.05 65)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="btn-gold px-8 rounded-full"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In & Start Tracking
          </Button>
        </div>
      </div>

      <footer
        className="py-5 text-center text-xs border-t"
        style={{ color: "oklch(0.42 0.04 55)", borderColor: "oklch(0.72 0.16 75 / 15%)" }}
      >
        🤠 Rodeo Companion · Built for competitors, by competitors
      </footer>
    </div>
  );
}
