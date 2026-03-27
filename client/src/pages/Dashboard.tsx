import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  CalendarDays, Trophy, BarChart3, MapPin, BookOpen,
  Settings, Bell, Plus, ChevronRight, Clock, DollarSign,
  TrendingUp, Star, Flame, Zap, Target,
} from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import {
  DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_COLORS, type Discipline,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";

// ─── Quick Action Card ────────────────────────────────────────────────────────
function QuickCard({
  icon: Icon,
  emoji,
  label,
  sub,
  accent,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  emoji?: string;
  label: string;
  sub?: string;
  accent: string;
  onClick: () => void;
  badge?: string | number;
}) {
  return (
    <button
      onClick={onClick}
      className="card-shimmer card-hover relative flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all active:scale-95 w-full"
      style={{ borderColor: `${accent}50` }}
    >
      {/* Glow accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)` }} />
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        {emoji ?? <Icon className="w-5 h-5" style={{ color: accent }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "oklch(0.93 0.03 75)" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5 truncate" style={{ color: "oklch(0.52 0.05 60)" }}>{sub}</p>}
      </div>
      {badge !== undefined && (
        <span className="absolute top-2.5 right-2.5 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold px-1.5"
          style={{ background: accent, color: "oklch(0.14 0.04 45)" }}>
          {badge}
        </span>
      )}
      <ChevronRight className="absolute bottom-3 right-3 w-3.5 h-3.5 opacity-40" style={{ color: accent }} />
    </button>
  );
}

// ─── Upcoming Rodeo Countdown ─────────────────────────────────────────────────
function UpcomingCountdown({ rodeo }: { rodeo: any }) {
  const [, navigate] = useLocation();
  const now = new Date();
  const rodeoDate = new Date(rodeo.rodeoDate);
  const deadlineDate = new Date(rodeo.entryDeadline);
  const daysToRodeo = differenceInDays(rodeoDate, now);
  const hoursToRodeo = differenceInHours(rodeoDate, now);
  const daysToDeadline = differenceInDays(deadlineDate, now);

  let disciplineList: Discipline[] = [];
  try { disciplineList = rodeo.disciplines ? JSON.parse(rodeo.disciplines) : [rodeo.discipline]; } catch { disciplineList = [rodeo.discipline]; }

  const urgency = daysToDeadline <= 2 ? "critical" : daysToDeadline <= 7 ? "warning" : "normal";
  const urgencyColor = urgency === "critical" ? "oklch(0.65 0.18 25)" : urgency === "warning" ? "oklch(0.78 0.18 80)" : "oklch(0.72 0.16 75)";

  return (
    <button
      onClick={() => navigate(`/schedule/${rodeo.id}`)}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.99] card-hover"
      style={{
        background: "linear-gradient(135deg, oklch(0.20 0.07 54), oklch(0.14 0.05 48))",
        border: `1px solid ${urgencyColor}40`,
        boxShadow: `0 8px 32px oklch(0 0 0 / 50%), 0 0 0 1px ${urgencyColor}15, inset 0 1px 0 ${urgencyColor}15`,
      }}
    >
      {/* Top gradient bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${urgencyColor}, oklch(0.55 0.20 25), ${urgencyColor}, transparent)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {urgency !== "normal" && <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: urgencyColor }} />}
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: urgencyColor }}>
                {urgency === "critical" ? "⚠ Entry Deadline Critical!" : urgency === "warning" ? "Deadline Approaching" : "🤠 Next Rodeo"}
              </span>
            </div>
            <h3 className="text-xl font-black leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 20px oklch(0.72 0.16 75 / 30%)" }}>
              {rodeo.name}
            </h3>
          </div>
          {/* Big countdown number */}
          <div className="text-right flex-shrink-0 flex flex-col items-center">
            <p className="text-4xl font-black leading-none"
              style={{ color: urgencyColor, fontFamily: "'Playfair Display', serif", textShadow: `0 0 20px ${urgencyColor}60` }}>
              {daysToRodeo === 0 ? (hoursToRodeo < 1 ? "🎯" : `${hoursToRodeo}h`) : `${daysToRodeo}`}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>
              {daysToRodeo === 0 ? "TODAY" : "days away"}
            </p>
          </div>
        </div>

        {/* Discipline chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {disciplineList.map((d) => {
            const c = DISCIPLINE_COLORS[d];
            return (
              <span key={d} className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold", c.bg, c.text)}>
                {DISCIPLINE_ICONS[d]} {DISCIPLINE_LABELS[d]}
              </span>
            );
          })}
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5" style={{ color: "oklch(0.62 0.05 65)" }}>
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }} />
            <span>{format(rodeoDate, "EEE, MMM d")}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: daysToDeadline <= 3 ? urgencyColor : "oklch(0.62 0.05 65)" }}>
            <Bell className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold">Entry: {daysToDeadline <= 0 ? "Passed" : `${daysToDeadline}d left`}</span>
          </div>
          {rodeo.locationName && (
            <div className="flex items-center gap-1.5 col-span-2" style={{ color: "oklch(0.62 0.05 65)" }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.62 0.05 65)" }} />
              <span className="truncate">{rodeo.locationName}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Animated Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, emoji, value, label, color, sub }: {
  icon: React.ElementType; emoji?: string; value: string | number; label: string; color: string; sub?: string;
}) {
  return (
    <div className="stat-card flex-1">
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-0.5"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {emoji ?? <Icon className="w-4 h-4" style={{ color }} />}
        </div>
        <p className="text-2xl font-black leading-none" style={{ color, fontFamily: "'Playfair Display', serif", textShadow: `0 0 16px ${color}50` }}>
          {value}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-center leading-tight" style={{ color: "oklch(0.52 0.05 60)" }}>
          {label}
        </p>
        {sub && <p className="text-[10px] text-center" style={{ color: `${color}80` }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: rodeos } = trpc.rodeos.list.useQuery();
  const { data: allRuns } = trpc.performances.list.useQuery();
  const { data: summary } = trpc.analytics.summary.useQuery({ period: "all" });

  const now = new Date();
  const upcoming = (rodeos ?? []).filter((r) => new Date(r.rodeoDate) >= now)
    .sort((a, b) => new Date(a.rodeoDate).getTime() - new Date(b.rodeoDate).getTime());
  const nextRodeo = upcoming[0];

  const totalRuns = allRuns?.length ?? 0;
  const totalWinnings = (allRuns ?? []).reduce((s, r) => s + (r.prizeMoneyCents ?? 0), 0);
  const upcomingCount = upcoming.length;
  const totalRodeos = rodeos?.length ?? 0;

  // Deadline alerts
  const deadlineAlerts = upcoming.filter((r) => {
    const d = differenceInDays(new Date(r.entryDeadline), now);
    return d >= 0 && d <= 7;
  });

  const firstName = user?.name?.split(" ")[0] ?? "Cowboy";

  return (
    <div className="min-h-screen bg-background page-enter">

      {/* ── Hero Header ── */}
      <div className="hero-western relative px-4 pt-12 pb-7">
        {/* Decorative Western stars */}
        <div className="absolute top-5 right-5 text-3xl opacity-15 select-none pointer-events-none">★</div>
        <div className="absolute top-10 right-14 text-lg opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute top-6 left-6 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute bottom-8 left-8 text-xs opacity-10 select-none pointer-events-none">★</div>
        {/* Glow orb top-right */}
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.16 75 / 12%) 0%, transparent 70%)" }} />
        {/* Glow orb bottom-left */}
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.20 25 / 10%) 0%, transparent 70%)" }} />

        <div className="max-w-lg mx-auto relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "oklch(0.72 0.16 75 / 70%)" }}>
                ✦ RODEO COMPANION ✦
              </p>
              <h1 className="text-4xl font-black leading-none mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 40px oklch(0.72 0.16 75 / 50%), 0 2px 4px oklch(0 0 0 / 60%)" }}>
                {firstName}
              </h1>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.62 0.05 65)" }}>
                Ready to ride? 🤠
              </p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "oklch(0.22 0.06 50)", border: "1px solid oklch(0.72 0.16 75 / 40%)", boxShadow: "0 0 12px oklch(0.72 0.16 75 / 20%)" }}
            >
              <Settings className="w-4.5 h-4.5" style={{ color: "oklch(0.72 0.16 75)" }} />
            </button>
          </div>

          {/* Stat cards row */}
          <div className="flex gap-2.5">
            <StatCard icon={Trophy} emoji="🏆" value={totalRuns} label="Total Runs" color="oklch(0.72 0.16 75)" />
            <StatCard icon={DollarSign} emoji="💰" value={`$${(totalWinnings / 100).toFixed(0)}`} label="Winnings" color="oklch(0.65 0.14 145)" />
            <StatCard icon={CalendarDays} emoji="📅" value={upcomingCount} label="Upcoming" color="oklch(0.65 0.14 195)" />
            <StatCard icon={Target} emoji="🐎" value={totalRodeos} label="Rodeos" color="oklch(0.65 0.18 25)" />
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-28 space-y-6">

        {/* ── Deadline Alerts Banner ── */}
        {deadlineAlerts.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "oklch(0.72 0.16 75 / 8%)", border: "1px solid oklch(0.72 0.16 75 / 35%)", boxShadow: "0 0 20px oklch(0.72 0.16 75 / 15%)" }}>
            <div className="banner-western">
              🔔 {deadlineAlerts.length} Entry Deadline{deadlineAlerts.length > 1 ? "s" : ""} This Week
            </div>
            <div className="p-3 space-y-2">
              {deadlineAlerts.map((r) => {
                const d = differenceInDays(new Date(r.entryDeadline), now);
                return (
                  <button key={r.id} onClick={() => navigate(`/schedule/${r.id}`)}
                    className="w-full flex items-center justify-between text-xs px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
                    style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 20%)" }}>
                    <span className="font-semibold" style={{ color: "oklch(0.93 0.03 75)" }}>{r.name}</span>
                    <span className={cn("font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide", d <= 2 ? "countdown-urgent" : "")}
                      style={{
                        background: d <= 2 ? "oklch(0.65 0.18 25 / 25%)" : "oklch(0.72 0.16 75 / 20%)",
                        color: d <= 2 ? "oklch(0.75 0.20 30)" : "oklch(0.78 0.18 80)",
                        border: `1px solid ${d <= 2 ? "oklch(0.65 0.18 25 / 40%)" : "oklch(0.72 0.16 75 / 30%)"}`,
                      }}>
                      {d === 0 ? "🚨 Today!" : `${d}d left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Next Rodeo Countdown ── */}
        <div>
          <div className="spur-divider">
            <span><Zap className="w-3 h-3 inline mr-1" style={{ color: "oklch(0.72 0.16 75)" }} />Next Up</span>
          </div>
          {nextRodeo ? (
            <UpcomingCountdown rodeo={nextRodeo} />
          ) : (
            <div className="rounded-2xl p-6 text-center border-rope"
              style={{ background: "linear-gradient(145deg, oklch(0.20 0.05 48), oklch(0.17 0.04 46))" }}>
              <div className="text-5xl mb-3">🐎</div>
              <p className="font-black text-lg mb-1" style={{ color: "oklch(0.78 0.18 80)", fontFamily: "'Playfair Display', serif", textShadow: "0 0 20px oklch(0.72 0.16 75 / 40%)" }}>
                No upcoming rodeos
              </p>
              <p className="text-xs mb-4" style={{ color: "oklch(0.52 0.05 60)" }}>Add your first rodeo to get started</p>
              <button onClick={() => navigate("/schedule")}
                className="btn-gold px-6 py-2.5 rounded-full text-sm font-black inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Rodeo
              </button>
            </div>
          )}
        </div>

        {/* ── Quick Navigation Grid ── */}
        <div>
          <div className="spur-divider">
            <span><Star className="w-3 h-3 inline mr-1" style={{ color: "oklch(0.72 0.16 75)" }} />Quick Access</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickCard
              icon={CalendarDays} emoji="📅"
              label="Schedule"
              sub={`${upcomingCount} upcoming`}
              accent="oklch(0.72 0.16 75)"
              onClick={() => navigate("/schedule")}
              badge={deadlineAlerts.length > 0 ? deadlineAlerts.length : undefined}
            />
            <QuickCard
              icon={Trophy} emoji="🏆"
              label="My Runs"
              sub={`${totalRuns} runs logged`}
              accent="oklch(0.65 0.18 25)"
              onClick={() => navigate("/performance")}
            />
            <QuickCard
              icon={BarChart3} emoji="📊"
              label="Progress"
              sub="Charts & analytics"
              accent="oklch(0.65 0.14 145)"
              onClick={() => navigate("/analytics")}
            />
            <QuickCard
              icon={MapPin} emoji="🗺️"
              label="Trip Planner"
              sub="Maps & fuel stations"
              accent="oklch(0.65 0.14 195)"
              onClick={() => navigate("/locations")}
            />
            <QuickCard
              icon={TrendingUp} emoji="🎯"
              label="Drills"
              sub="Training suggestions"
              accent="oklch(0.60 0.12 280)"
              onClick={() => navigate("/analytics")}
            />
            <QuickCard
              icon={BookOpen} emoji="📖"
              label="Guide"
              sub="How to use the app"
              accent="oklch(0.62 0.08 65)"
              onClick={() => navigate("/help")}
            />
          </div>
        </div>

        {/* ── Recent Runs ── */}
        {totalRuns > 0 && (
          <div>
            <div className="spur-divider">
              <span><Clock className="w-3 h-3 inline mr-1" style={{ color: "oklch(0.72 0.16 75)" }} />Recent Runs</span>
            </div>
            <div className="space-y-2">
              {(allRuns ?? []).slice(0, 3).map((run: any) => {
                const d = run.discipline as Discipline;
                const c = DISCIPLINE_COLORS[d] ?? { bg: "bg-gray-800", text: "text-gray-300", accent: "#888" };
                return (
                  <div key={run.id} className="card-shimmer card-hover flex items-center gap-3 p-3 rounded-xl">
                    <div className={cn("icon-badge text-xl", c.bg)}>
                      {DISCIPLINE_ICONS[d]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "oklch(0.93 0.03 75)" }}>
                        {DISCIPLINE_LABELS[d]}
                      </p>
                      <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
                        {format(new Date(run.runDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    {run.timeSeconds != null && (
                      <p className="num-gold text-base flex-shrink-0">
                        {((run.timeSeconds ?? 0) + (run.penaltySeconds ?? 0)).toFixed(3)}s
                      </p>
                    )}
                    {run.score != null && (
                      <p className="num-gold text-base flex-shrink-0">
                        {run.score} pts
                      </p>
                    )}
                    {run.prizeMoneyCents > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "oklch(0.65 0.14 145 / 20%)", color: "oklch(0.65 0.14 145)", border: "1px solid oklch(0.65 0.14 145 / 30%)" }}>
                        +${(run.prizeMoneyCents / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                );
              })}
              <button onClick={() => navigate("/performance")}
                className="w-full text-center text-xs font-semibold py-2 rounded-xl transition-all"
                style={{ color: "oklch(0.72 0.16 75)", background: "oklch(0.72 0.16 75 / 8%)", border: "1px solid oklch(0.72 0.16 75 / 20%)" }}>
                View all {totalRuns} runs →
              </button>
            </div>
          </div>
        )}

        {/* ── Footer branding ── */}
        <div className="text-center py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "oklch(0.72 0.16 75 / 30%)" }}>
            ✦ RODEO COMPANION ✦
          </p>
        </div>
      </div>
    </div>
  );
}
