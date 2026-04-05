import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  CalendarDays, Bell, MapPin, Settings, ChevronRight, CheckCircle2, Crown,
} from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import {
  DISCIPLINE_LABELS, DISCIPLINE_IMAGES, DISCIPLINE_COLORS,
  isTimedDiscipline, formatTime, formatScore, type Discipline,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: rodeos } = trpc.rodeos.list.useQuery();
  const { data: allRuns } = trpc.performances.list.useQuery();
  const { data: summary } = trpc.analytics.summary.useQuery({ period: "year" });
  const currentYear = new Date().getFullYear();
  const { data: seasonGoal } = trpc.seasonGoals.get.useQuery({ year: currentYear });
  const { data: usage } = trpc.plan.usage.useQuery();
  const markEntered = trpc.rodeos.update.useMutation({
    onSuccess: () => { utils.rodeos.list.invalidate(); toast.success("Marked as entered!"); },
  });

  const now = new Date();
  const upcoming = (rodeos ?? [])
    .filter((r) => new Date(r.rodeoDate) >= now)
    .sort((a, b) => new Date(a.rodeoDate).getTime() - new Date(b.rodeoDate).getTime());
  const nextRodeo = upcoming[0];

  // Deadlines closing within 7 days
  const deadlineAlerts = upcoming.filter((r) => {
    const d = differenceInDays(new Date(r.entryDeadline), now);
    return d >= 0 && d <= 7 && !r.isEntered;
  });

  // Last run + season average comparison
  const lastRun = allRuns?.[0] as (typeof allRuns extends (infer T)[] | undefined ? T : never) | undefined;
  const lastRunDiscipline = lastRun?.discipline as Discipline | undefined;
  const lastRunIsTimed = lastRunDiscipline ? isTimedDiscipline(lastRunDiscipline) : true;

  // Compute season avg for last run's discipline
  let seasonAvg: number | null = null;
  if (lastRun && allRuns) {
    const sameDisc = allRuns.filter((r) => r.discipline === lastRun.discipline);
    if (lastRunIsTimed) {
      const times = sameDisc.filter((r) => r.timeSeconds != null).map((r) => (r.timeSeconds ?? 0) + (r.penaltySeconds ?? 0));
      seasonAvg = times.length > 1 ? times.reduce((a, b) => a + b, 0) / times.length : null;
    } else {
      const scores = sameDisc.filter((r) => r.score != null).map((r) => r.score ?? 0);
      seasonAvg = scores.length > 1 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    }
  }

  // Season prize money
  const totalWinnings = (allRuns ?? []).reduce((s, r) => s + (r.prizeMoneyCents ?? 0), 0);
  const goalCents = seasonGoal?.targetCents ?? 0;
  const goalPct = goalCents > 0 ? Math.min(100, Math.round((totalWinnings / goalCents) * 100)) : 0;

  const firstName = user?.name?.split(" ")[0] ?? "Cowboy";

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* ── Header ── */}
      <div className="hero-western relative px-4 pt-10 pb-5">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1"
                style={{ color: "oklch(0.72 0.16 75 / 60%)", fontFamily: "'Cinzel', serif" }}>
                What do I need this week?
              </p>
              <h1 className="text-3xl font-black leading-none"
                style={{ fontFamily: "'Cinzel', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
                Hey, {firstName}
              </h1>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.72 0.16 75 / 15%)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}
            >
              <Settings className="w-5 h-5" style={{ color: "oklch(0.78 0.18 80)" }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4">

        {/* ── (a) Entry Deadlines ── */}
        {deadlineAlerts.length > 0 && (
          <div className="space-y-2">
            {deadlineAlerts.map((r) => {
              const d = differenceInDays(new Date(r.entryDeadline), now);
              const isCritical = d <= 2;
              return (
                <div key={r.id} className="rounded-xl overflow-hidden"
                  style={{
                    background: isCritical
                      ? "linear-gradient(135deg, oklch(0.20 0.08 25), oklch(0.16 0.06 30))"
                      : "oklch(0.18 0.04 48)",
                    border: `1.5px solid ${isCritical ? "oklch(0.65 0.18 25 / 60%)" : "oklch(0.72 0.16 75 / 30%)"}`,
                  }}>
                  <div className="h-0.5 w-full" style={{ background: isCritical ? "oklch(0.65 0.18 25)" : "oklch(0.72 0.16 75)" }} />
                  <div className="p-3 flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: isCritical ? "oklch(0.65 0.18 25 / 20%)" : "oklch(0.72 0.16 75 / 15%)" }}>
                      <Bell className="w-5 h-5" style={{ color: isCritical ? "oklch(0.75 0.20 30)" : "oklch(0.78 0.18 80)" }} />
                    </div>
                    <button onClick={() => navigate(`/schedule/${r.id}`)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold truncate" style={{ color: "oklch(0.93 0.03 75)" }}>{r.name}</p>
                      <p className="text-xs" style={{ color: isCritical ? "oklch(0.75 0.20 30)" : "oklch(0.62 0.05 65)" }}>
                        Entry deadline {d === 0 ? "TODAY" : d === 1 ? "tomorrow" : `in ${d} days`}
                      </p>
                    </button>
                    <button
                      onClick={() => markEntered.mutate({ id: r.id, isEntered: true })}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      style={{
                        background: "oklch(0.65 0.14 145 / 20%)",
                        color: "oklch(0.72 0.16 145)",
                        border: "1px solid oklch(0.65 0.14 145 / 30%)",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Entered
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── (b) Next Rodeo Countdown ── */}
        {nextRodeo ? (() => {
          const rodeoDate = new Date(nextRodeo.rodeoDate);
          const daysToRodeo = differenceInDays(rodeoDate, now);
          const hoursToRodeo = differenceInHours(rodeoDate, now);
          let disciplineList: Discipline[] = [];
          try { disciplineList = (nextRodeo as any).disciplines ? JSON.parse((nextRodeo as any).disciplines) : [nextRodeo.discipline]; }
          catch { disciplineList = [nextRodeo.discipline as Discipline]; }

          return (
            <button
              onClick={() => navigate(`/schedule/${nextRodeo.id}`)}
              className="w-full text-left rounded-xl overflow-hidden transition-all active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, oklch(0.20 0.07 54), oklch(0.15 0.05 48))",
                border: "1px solid oklch(0.72 0.16 75 / 35%)",
                boxShadow: "0 4px 20px oklch(0 0 0 / 40%)",
              }}>
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, oklch(0.72 0.16 75), oklch(0.55 0.20 25))" }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1"
                      style={{ color: "oklch(0.72 0.16 75)", fontFamily: "'Cinzel', serif" }}>
                      Next Rodeo
                    </p>
                    <h3 className="text-lg font-black leading-tight truncate"
                      style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)" }}>
                      {nextRodeo.name}
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-black leading-none"
                      style={{ color: "oklch(0.78 0.18 80)", fontFamily: "'Cinzel', serif", textShadow: "0 0 16px oklch(0.72 0.16 75 / 50%)" }}>
                      {daysToRodeo === 0 ? (hoursToRodeo < 1 ? "NOW" : `${hoursToRodeo}h`) : daysToRodeo}
                    </p>
                    <p className="text-[10px] font-bold uppercase" style={{ color: "oklch(0.52 0.05 60)" }}>
                      {daysToRodeo === 0 ? "today" : "days"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {disciplineList.map((d) => {
                    const c = DISCIPLINE_COLORS[d];
                    return (
                      <span key={d} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold", c?.bg, c?.text)}>
                        <img src={DISCIPLINE_IMAGES[d]} alt="" className="w-3.5 h-3.5 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        {DISCIPLINE_LABELS[d]}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "oklch(0.62 0.05 65)" }}>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.16 75)" }} />
                    {format(rodeoDate, "EEE, MMM d")}
                  </span>
                  {nextRodeo.locationName && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {nextRodeo.locationName}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }} />
                </div>
              </div>
            </button>
          );
        })() : (
          <div className="rounded-xl p-6 text-center"
            style={{ background: "oklch(0.18 0.04 48)", border: "1px dashed oklch(0.32 0.07 55)" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "oklch(0.62 0.05 65)" }}>No upcoming rodeos</p>
            <p className="text-xs mb-3" style={{ color: "oklch(0.42 0.04 55)" }}>Browse events or add one to your schedule</p>
            <button onClick={() => navigate("/schedule")}
              className="btn-gold px-5 py-2 rounded-full text-xs font-bold">
              Add Rodeo
            </button>
          </div>
        )}

        {/* ── (c) Last Run Result ── */}
        {lastRun && lastRunDiscipline && (() => {
          const lastTime = lastRunIsTimed ? (lastRun.timeSeconds ?? 0) + (lastRun.penaltySeconds ?? 0) : null;
          const lastScore = !lastRunIsTimed ? lastRun.score : null;
          const c = DISCIPLINE_COLORS[lastRunDiscipline];
          let vsAvg: string | null = null;
          if (seasonAvg != null) {
            if (lastRunIsTimed && lastTime != null) {
              const diff = lastTime - seasonAvg;
              vsAvg = diff <= 0 ? `${Math.abs(diff).toFixed(3)}s faster` : `${diff.toFixed(3)}s slower`;
            } else if (!lastRunIsTimed && lastScore != null) {
              const diff = lastScore - seasonAvg;
              vsAvg = diff >= 0 ? `${diff.toFixed(1)} pts above avg` : `${Math.abs(diff).toFixed(1)} pts below avg`;
            }
          }
          const improved = lastRunIsTimed
            ? (lastTime != null && seasonAvg != null && lastTime <= seasonAvg)
            : (lastScore != null && seasonAvg != null && lastScore >= seasonAvg);

          return (
            <div className="rounded-xl overflow-hidden"
              style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
              <div className="p-3 flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-lg overflow-hidden flex-shrink-0", c?.bg)}>
                  <img src={DISCIPLINE_IMAGES[lastRunDiscipline]} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Last Run</p>
                  <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>{DISCIPLINE_LABELS[lastRunDiscipline]}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Cinzel', serif" }}>
                    {lastRunIsTimed ? formatTime(lastTime) : formatScore(lastScore)}
                  </p>
                  {vsAvg && (
                    <p className="text-[10px] font-bold"
                      style={{ color: improved ? "oklch(0.65 0.14 145)" : "oklch(0.65 0.18 25)" }}>
                      {vsAvg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── (d) Season Snapshot ── */}
        <div className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, oklch(0.20 0.07 54), oklch(0.15 0.05 48))",
            border: "1px solid oklch(0.72 0.16 75 / 25%)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: "oklch(0.72 0.16 75)", fontFamily: "'Cinzel', serif" }}>
              {currentYear} Season
            </p>
            <p className="text-sm font-black"
              style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Cinzel', serif" }}>
              ${(totalWinnings / 100).toFixed(0)}
              {goalCents > 0 && (
                <span className="text-xs font-normal ml-1" style={{ color: "oklch(0.52 0.05 60)" }}>
                  / ${(goalCents / 100).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          {goalCents > 0 ? (
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.25 0.05 50)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${goalPct}%`,
                  background: goalPct >= 100
                    ? "linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.72 0.22 145))"
                    : "linear-gradient(90deg, oklch(0.62 0.16 75), oklch(0.78 0.20 80))",
                  boxShadow: goalPct >= 100 ? "0 0 10px oklch(0.65 0.18 145 / 70%)" : "0 0 10px oklch(0.72 0.16 75 / 70%)",
                }}
              />
            </div>
          ) : (
            <p className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>
              Set a season goal in Settings to track progress
            </p>
          )}
          {goalCents > 0 && (
            <p className="text-xs mt-1.5" style={{ color: "oklch(0.52 0.05 60)" }}>
              {goalPct >= 100 ? "Goal reached!" : `${goalPct}% — $${((goalCents - totalWinnings) / 100).toFixed(0)} to go`}
            </p>
          )}
        </div>

        {/* ── Free tier nudge ── */}
        {usage && usage.plan === "free" && (
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full flex items-center gap-3 rounded-xl p-3 transition-all active:scale-[0.99]"
            style={{ background: "oklch(0.72 0.16 75 / 10%)", border: "1px solid oklch(0.72 0.16 75 / 25%)" }}
          >
            <Crown className="w-5 h-5 flex-shrink-0" style={{ color: "oklch(0.78 0.18 80)" }} />
            <div className="flex-1 text-left">
              <p className="text-xs font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>Free Plan</p>
              <p className="text-[10px]" style={{ color: "oklch(0.52 0.05 60)" }}>
                {usage.rodeoCount}/{usage.limits.maxRodeos} rodeos, {usage.performanceCount}/{usage.limits.maxPerformances} runs
              </p>
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }} />
          </button>
        )}
      </div>
    </div>
  );
}
