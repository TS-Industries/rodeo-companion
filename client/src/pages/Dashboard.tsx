import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Trophy, BarChart3, MapPin,
  Settings, Bell, Plus, ChevronRight, Clock, DollarSign,
  TrendingUp, Star, Flame, Zap, Target, Users, Flag,
} from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import {
  DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_IMAGES, DISCIPLINE_COLORS, type Discipline,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";

// ─── Horse Silhouette Icon ───────────────────────────────────────────────────
function HorseSilhouette({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Clean horse side profile silhouette */}
      <path d="M54 10c-1.5 0-3 .6-4 1.8l-2.5 3-2.5-1.2c-.6-.3-1.3-.3-1.9 0L40 15l-1.8-2.8C37.3 11 35.8 10 34 10c-2.5 0-4.7 1.4-5.8 3.5l-.7 1.4-3.5-.9C21.5 13.3 19 15 18.2 17.5L17 21h-2.5C12.6 21 11 22.6 11 24.5v1.5c0 1.9 1.6 3.5 3.5 3.5H16v4l-2.5 9c-.3 1.2.4 2.4 1.6 2.7 1.2.3 2.4-.4 2.7-1.6L20 35h1v6.5c0 1.4 1.1 2.5 2.5 2.5S26 42.9 26 41.5V35h8v6.5c0 1.4 1.1 2.5 2.5 2.5S39 42.9 39 41.5V35l3.5.8v5.2c0 1.4 1.1 2.5 2.5 2.5S47.5 42.4 47.5 41V35.5l1.8-1.8c1-1 1.7-2.4 1.7-3.8V24c0-1.3-.4-2.5-1.1-3.5L47 18l2.2-2.2c.5-.5.8-1.2.8-1.8v-2c0-1.1-.9-2-2-2zm-15 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  );
}

// ─── Western Quotes ───────────────────────────────────────────────────────────
const WESTERN_QUOTES = [
  { text: "The cowboy must never shoot first, hit a smaller man, or take unfair advantage.", author: "John Wayne" },
  { text: "Courage is being scared to death, but saddling up anyway.", author: "John Wayne" },
  { text: "A good horse makes short miles.", author: "Western Proverb" },
  { text: "The outside of a horse is good for the inside of a man.", author: "Winston Churchill" },
  { text: "Eight seconds of glory — a lifetime of dedication.", author: "Rodeo Wisdom" },
  { text: "There's something about the outside of a horse that is good for the inside of a man.", author: "Ronald Reagan" },
  { text: "A cowboy is a man with guts and a horse.", author: "William James" },
  { text: "Ride hard, live free, die young — but not today.", author: "Rodeo Proverb" },
  { text: "The harder you work, the luckier you get in the arena.", author: "Rodeo Wisdom" },
  { text: "A true cowboy knows love, pain, and shame, and never runs from any of them.", author: "Western Saying" },
  { text: "Champions aren't made in the arena — they're revealed there.", author: "Rodeo Wisdom" },
  { text: "Every cowboy sings a sad, sad song.", author: "Tim McGraw" },
  { text: "Dust yourself off and get back on.", author: "Rodeo Proverb" },
  { text: "It's not about the buckle — it's about the ride.", author: "Rodeo Wisdom" },
  { text: "A horse is the projection of peoples' dreams about themselves — strong, powerful, beautiful.", author: "Pam Brown" },
  { text: "In the arena of life, the honours and rewards fall to those who show their good qualities in action.", author: "Aristotle" },
  { text: "The rodeo ain't over till the bull riders ride.", author: "Western Saying" },
  { text: "No hour of life is wasted that is spent in the saddle.", author: "Winston Churchill" },
  { text: "Cowboys don't cry — but sometimes the dust gets in their eyes.", author: "Western Proverb" },
  { text: "Ride every ride like it's your last — because someday it will be.", author: "Rodeo Wisdom" },
];

// ─── Rotating Quote Component ─────────────────────────────────────────────────
function RotatingQuote() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * WESTERN_QUOTES.length));
  const [visible, setVisible] = useState(true);
  const [key, setKey] = useState(0);

  const nextQuote = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIdx((i) => (i + 1) % WESTERN_QUOTES.length);
      setKey((k) => k + 1);
      setVisible(true);
    }, 600);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextQuote, 7000);
    return () => clearInterval(timer);
  }, [nextQuote]);

  const q = WESTERN_QUOTES[idx];

  return (
    <div
      key={key}
      className="text-center px-2"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <p
        className="text-sm leading-relaxed italic mb-1"
        style={{
          color: "oklch(0.88 0.08 75)",
          fontFamily: "'Playfair Display', serif",
          textShadow: "0 1px 8px oklch(0 0 0 / 60%)",
        }}
      >
        "{q.text}"
      </p>
      <p
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "oklch(0.72 0.16 75 / 80%)" }}
      >
        — {q.author}
      </p>
    </div>
  );
}

// ─── Premium Stat Card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, color, sub }: {
  icon: React.ElementType; value: string | number; label: string; color: string; sub?: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-1 relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, oklch(0.22 0.07 52), oklch(0.16 0.04 46))`,
        border: `1px solid ${color}30`,
        boxShadow: `0 4px 16px oklch(0 0 0 / 40%), inset 0 1px 0 ${color}15`,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <Icon className="w-5 h-5" style={{ color, filter: `drop-shadow(0 0 6px ${color}80)` }} />
      <p
        className="text-xl font-black leading-none"
        style={{
          color,
          fontFamily: "'Oswald', 'Arial Narrow', sans-serif",
          textShadow: `0 0 16px ${color}60`,
          letterSpacing: "0.02em",
        }}
      >
        {value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight"
        style={{ color: "oklch(0.52 0.05 60)" }}>
        {label}
      </p>
      {sub && <p className="text-[9px] text-center" style={{ color: `${color}70` }}>{sub}</p>}
    </div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function QuickCard({
  icon: Icon, label, sub, accent, onClick, badge,
}: {
  icon: React.ElementType; label: string; sub?: string; accent: string; onClick: () => void; badge?: string | number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all active:scale-95 w-full overflow-hidden"
      style={{
        background: `linear-gradient(145deg, oklch(0.21 0.06 50), oklch(0.17 0.04 46))`,
        border: `1px solid ${accent}35`,
        boxShadow: `0 4px 20px oklch(0 0 0 / 40%), inset 0 1px 0 ${accent}15`,
        transition: "box-shadow 0.2s, border-color 0.2s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${accent}30, 0 8px 24px oklch(0 0 0 / 50%)`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accent}60`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px oklch(0 0 0 / 40%), inset 0 1px 0 ${accent}15`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accent}35`;
      }}
    >
      {/* Glow accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}80, ${accent}30, transparent)` }} />
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-5 h-5" style={{ color: accent, filter: `drop-shadow(0 0 4px ${accent}60)` }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "oklch(0.93 0.03 75)", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}>{label}</p>
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
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.99]"
      style={{
        background: "linear-gradient(135deg, oklch(0.20 0.07 54), oklch(0.14 0.05 48))",
        border: `1px solid ${urgencyColor}40`,
        boxShadow: `0 8px 32px oklch(0 0 0 / 50%), 0 0 0 1px ${urgencyColor}15, inset 0 1px 0 ${urgencyColor}15`,
      }}
    >
      {/* Top gradient bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${urgencyColor}, oklch(0.55 0.20 25), ${urgencyColor}, transparent)` }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {urgency !== "normal" && <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: urgencyColor }} />}
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: urgencyColor, fontFamily: "'Cinzel', serif" }}>
                {urgency === "critical" ? "⚠ Entry Deadline Critical!" : urgency === "warning" ? "Deadline Approaching" : "✦ Next Rodeo"}
              </span>
            </div>
            <h3 className="text-xl font-black leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 20px oklch(0.72 0.16 75 / 30%)" }}>
              {rodeo.name}
            </h3>
          </div>
          {/* Big countdown */}
          <div className="text-right flex-shrink-0 flex flex-col items-center">
            <p className="text-4xl font-black leading-none"
              style={{ color: urgencyColor, fontFamily: "'Oswald', sans-serif", textShadow: `0 0 20px ${urgencyColor}60`, letterSpacing: "-0.02em" }}>
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
              <span key={d} className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold", c?.bg, c?.text)}>
                <img src={DISCIPLINE_IMAGES[d]} alt="" className="w-3.5 h-3.5 rounded object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                {DISCIPLINE_LABELS[d]}
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
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{rodeo.locationName}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: rodeos } = trpc.rodeos.list.useQuery();
  const { data: allRuns } = trpc.performances.list.useQuery();
  const { data: summary } = trpc.analytics.summary.useQuery({ period: "all" });
  const currentYear = new Date().getFullYear();
  const { data: seasonGoal } = trpc.seasonGoals.get.useQuery({ year: currentYear });

  const now = new Date();
  const upcoming = (rodeos ?? [])
    .filter((r) => new Date(r.rodeoDate) >= now)
    .sort((a, b) => new Date(a.rodeoDate).getTime() - new Date(b.rodeoDate).getTime());
  const nextRodeo = upcoming[0];

  const totalRuns = allRuns?.length ?? 0;
  const totalWinnings = (allRuns ?? []).reduce((s, r) => s + (r.prizeMoneyCents ?? 0), 0);
  const upcomingCount = upcoming.length;
  const totalRodeos = rodeos?.length ?? 0;

  const deadlineAlerts = upcoming.filter((r) => {
    const d = differenceInDays(new Date(r.entryDeadline), now);
    return d >= 0 && d <= 7;
  });

  const firstName = user?.name?.split(" ")[0] ?? "Cowboy";

  return (
    <div className="min-h-screen bg-background page-enter">

      {/* ── Cinematic Hero ── */}
      <div className="hero-cinematic relative" style={{ minHeight: 320 }}>
        {/* Background image */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/rodeo-hero-dashboard_c6f8030b.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: "brightness(0.75) saturate(1.2)" }}
        />
        {/* Gradient overlay (handled by ::after in CSS) */}

        {/* Content */}
        <div className="relative z-10 px-4 pt-12 pb-6 max-w-lg mx-auto flex flex-col gap-4">

          {/* Top row: greeting + settings */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1"
                style={{ color: "oklch(0.72 0.16 75)", fontFamily: "'Cinzel', serif", textShadow: "0 0 12px oklch(0.72 0.16 75 / 60%)" }}>
                ✦ RODEO COMPANION ✦
              </p>
              <h1
                className="text-4xl font-black leading-none mb-1"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "oklch(0.97 0.03 75)",
                  textShadow: "0 0 30px oklch(0.72 0.16 75 / 60%), 0 2px 8px oklch(0 0 0 / 80%)",
                  letterSpacing: "0.02em",
                }}
              >
                {firstName}
              </h1>
              <p className="text-sm font-semibold" style={{ color: "oklch(0.80 0.06 70)", textShadow: "0 1px 4px oklch(0 0 0 / 60%)" }}>
                Ready to ride? 🤠
              </p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: "oklch(0.14 0.05 46 / 70%)",
                border: "1px solid oklch(0.72 0.16 75 / 50%)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 16px oklch(0.72 0.16 75 / 25%)",
              }}
            >
              <Settings className="w-5 h-5" style={{ color: "oklch(0.78 0.18 80)" }} />
            </button>
          </div>

          {/* Rotating quote */}
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "oklch(0.10 0.04 45 / 65%)",
              backdropFilter: "blur(16px)",
              border: "1px solid oklch(0.72 0.16 75 / 25%)",
              boxShadow: "0 4px 20px oklch(0 0 0 / 40%), inset 0 1px 0 oklch(0.72 0.16 75 / 15%)",
            }}
          >
            <RotatingQuote />
          </div>

          {/* Stat cards */}
          <div className="flex gap-2">
            <StatCard icon={Trophy} value={totalRuns} label="Total Runs" color="oklch(0.72 0.16 75)" />
            <StatCard icon={DollarSign} value={`$${(totalWinnings / 100).toFixed(0)}`} label="Winnings" color="oklch(0.65 0.14 145)" />
            <StatCard icon={CalendarDays} value={upcomingCount} label="Upcoming" color="oklch(0.65 0.14 195)" />
            <StatCard icon={Flag} value={totalRodeos} label="Rodeos" color="oklch(0.65 0.18 25)" />
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-28 space-y-6">

        {/* ── Deadline Alerts ── */}
        {deadlineAlerts.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "oklch(0.72 0.16 75 / 8%)",
              border: "1px solid oklch(0.72 0.16 75 / 35%)",
              boxShadow: "0 0 24px oklch(0.72 0.16 75 / 15%)",
            }}>
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

        {/* ── Season Goal Progress ── */}
        {seasonGoal && seasonGoal.targetCents > 0 && (() => {
          const pct = Math.min(100, Math.round((totalWinnings / seasonGoal.targetCents) * 100));
          const isHit = pct >= 100;
          return (
            <div className="rounded-2xl overflow-hidden card-glow-pulse"
              style={{
                background: isHit
                  ? "linear-gradient(135deg, oklch(0.18 0.08 145), oklch(0.14 0.05 140))"
                  : "linear-gradient(135deg, oklch(0.20 0.07 54), oklch(0.14 0.05 48))",
                border: `1px solid ${isHit ? "oklch(0.65 0.18 145 / 50%)" : "oklch(0.72 0.16 75 / 35%)"}`,
              }}>
              <div className="px-4 pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" style={{ color: isHit ? "oklch(0.65 0.18 145)" : "oklch(0.72 0.16 75)" }} />
                    <span className="text-xs font-black uppercase tracking-wide"
                      style={{ color: isHit ? "oklch(0.65 0.18 145)" : "oklch(0.72 0.16 75)", fontFamily: "'Cinzel', serif" }}>
                      {currentYear} Season Goal
                    </span>
                  </div>
                  <span className="text-sm font-black" style={{ color: isHit ? "oklch(0.65 0.18 145)" : "oklch(0.78 0.18 80)", fontFamily: "'Oswald', sans-serif" }}>
                    {pct}%
                  </span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <p className="text-2xl font-black"
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      color: isHit ? "oklch(0.75 0.18 145)" : "oklch(0.88 0.18 80)",
                      textShadow: isHit ? "0 0 20px oklch(0.65 0.18 145 / 60%)" : "0 0 20px oklch(0.72 0.16 75 / 50%)",
                    }}>
                    ${(totalWinnings / 100).toFixed(0)}
                    <span className="text-sm font-medium ml-1" style={{ color: "oklch(0.52 0.05 60)" }}>
                      / ${(seasonGoal.targetCents / 100).toLocaleString()}
                    </span>
                  </p>
                  {isHit && <span className="text-2xl">🏆</span>}
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.25 0.05 50)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: isHit
                        ? "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.72 0.22 145))"
                        : "linear-gradient(90deg, oklch(0.62 0.16 75), oklch(0.78 0.20 80))",
                      boxShadow: isHit ? "0 0 10px oklch(0.65 0.18 145 / 70%)" : "0 0 10px oklch(0.72 0.16 75 / 70%)",
                    }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: "oklch(0.52 0.05 60)" }}>
                  {isHit ? "🎉 Goal achieved! Incredible season!" : `$${((seasonGoal.targetCents - totalWinnings) / 100).toFixed(0)} to go`}
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Next Rodeo Countdown ── */}
        <div>
          <div className="rope-divider">
            <span><Zap className="w-3 h-3 inline mr-1" style={{ color: "oklch(0.72 0.16 75)" }} />Next Up</span>
          </div>
          {nextRodeo ? (
            <UpcomingCountdown rodeo={nextRodeo} />
          ) : (
            <div className="rounded-2xl p-6 text-center border-rope"
              style={{ background: "linear-gradient(145deg, oklch(0.20 0.05 48), oklch(0.17 0.04 46))" }}>
              {/* Premium Western lasso icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.72 0.16 75 / 15%), oklch(0.65 0.14 70 / 8%))",
                      border: "1.5px solid oklch(0.72 0.16 75 / 30%)",
                      boxShadow: "0 0 24px oklch(0.72 0.16 75 / 20%)",
                    }}>
                    <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Lasso / rope loop */}
                      <circle cx="22" cy="22" r="13" stroke="oklch(0.72 0.16 75)" strokeWidth="2.5" strokeDasharray="4 3" fill="none" opacity="0.7"/>
                      <circle cx="22" cy="22" r="7" stroke="oklch(0.72 0.16 75)" strokeWidth="2" fill="none"/>
                      {/* Rope tail */}
                      <path d="M31 31 Q37 36 38 42" stroke="oklch(0.72 0.16 75)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      {/* Star center */}
                      <path d="M22 17l1.5 4.5H28l-3.7 2.7 1.4 4.3L22 26l-3.7 2.5 1.4-4.3L16 21.5h4.5z" fill="oklch(0.82 0.18 80)" opacity="0.9"/>
                    </svg>
                  </div>
                </div>
              </div>
              <p className="font-black text-lg mb-1"
                style={{ color: "oklch(0.78 0.18 80)", fontFamily: "'Cinzel', serif", textShadow: "0 0 20px oklch(0.72 0.16 75 / 40%)" }}>
                No Upcoming Rodeos
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
          <div className="rope-divider">
            <span><Star className="w-3 h-3 inline mr-1" style={{ color: "oklch(0.72 0.16 75)" }} />Quick Access</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickCard icon={CalendarDays} label="Schedule" sub={`${upcomingCount} upcoming`}
              accent="oklch(0.72 0.16 75)" onClick={() => navigate("/schedule")}
              badge={deadlineAlerts.length > 0 ? deadlineAlerts.length : undefined} />
            <QuickCard icon={Trophy} label="My Runs" sub={`${totalRuns} runs logged`}
              accent="oklch(0.65 0.18 25)" onClick={() => navigate("/performance")} />
            <QuickCard icon={BarChart3} label="Progress" sub="Charts & analytics"
              accent="oklch(0.65 0.14 145)" onClick={() => navigate("/analytics")} />
            <QuickCard icon={MapPin} label="Trip Planner" sub="Maps & fuel stations"
              accent="oklch(0.65 0.14 195)" onClick={() => navigate("/locations")} />
            <QuickCard icon={HorseSilhouette} label="My Horses" sub="Manage your horses"
              accent="oklch(0.65 0.12 55)" onClick={() => navigate("/horses")} />
            <QuickCard icon={Users} label="Contacts" sub="Partners & team"
              accent="oklch(0.60 0.12 280)" onClick={() => navigate("/contacts")} />
          </div>
        </div>

        {/* ── Recent Runs ── */}
        {totalRuns > 0 && (
          <div>
            <div className="rope-divider">
              <span><Clock className="w-3 h-3 inline mr-1" style={{ color: "oklch(0.72 0.16 75)" }} />Recent Runs</span>
            </div>
            <div className="space-y-2">
              {(allRuns ?? []).slice(0, 3).map((run: any) => {
                const d = run.discipline as Discipline;
                const c = DISCIPLINE_COLORS[d] ?? { bg: "bg-gray-800", text: "text-gray-300", accent: "#888" };
                return (
                  <div key={run.id} className="card-shimmer card-hover flex items-center gap-3 p-3 rounded-xl">
                    <div className={cn("icon-badge overflow-hidden", c.bg)}>
                      <img src={DISCIPLINE_IMAGES[d]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate"
                        style={{ color: "oklch(0.93 0.03 75)", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}>
                        {DISCIPLINE_LABELS[d]}
                      </p>
                      <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
                        {format(new Date(run.runDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    {run.timeSeconds != null && (
                      <p className="num-gold text-base flex-shrink-0 font-oswald">
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
                className="w-full text-center text-xs font-bold py-2.5 rounded-xl transition-all"
                style={{
                  color: "oklch(0.72 0.16 75)",
                  background: "oklch(0.72 0.16 75 / 8%)",
                  border: "1px solid oklch(0.72 0.16 75 / 20%)",
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.05em",
                }}>
                VIEW ALL {totalRuns} RUNS →
              </button>
            </div>
          </div>
        )}

        {/* ── Footer branding ── */}
        <div className="text-center py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]"
            style={{ color: "oklch(0.72 0.16 75 / 30%)", fontFamily: "'Cinzel', serif" }}>
            ✦ RODEO COMPANION ✦
          </p>
        </div>
      </div>
    </div>
  );
}
