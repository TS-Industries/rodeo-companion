import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";
import {
  TrendingDown, TrendingUp, Minus, Dumbbell, Loader2, Trophy,
  ExternalLink, Play, Target, Award, Star, Zap, Download,
} from "lucide-react";
import {
  DISCIPLINES, DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_COLORS,
  DISCIPLINE_DRILL_VIDEOS,
  isTimedDiscipline, formatTime, formatScore, type Discipline,
} from "@/lib/disciplines";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS, formatDollars, type ExpenseCategory } from "@/lib/expenses";

const PERIOD_OPTIONS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
] as const;

type Period = "week" | "month" | "year" | "all";

const CHART_COLORS = [
  "#d97706", // amber/gold
  "#16a34a", // green
  "#dc2626", // red
  "#7c3aed", // purple
  "#0d9488", // teal
  "#c2410c", // orange
  "#db2777", // pink
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, trend, highlight, icon,
}: {
  label: string; value: string; sub?: string;
  trend?: "up" | "down" | "flat"; highlight?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3 relative overflow-hidden"
      style={{
        background: highlight
          ? "linear-gradient(135deg, oklch(0.22 0.08 55), oklch(0.18 0.06 50))"
          : "oklch(0.18 0.04 48)",
        border: `1px solid ${highlight ? "oklch(0.72 0.16 75 / 50%)" : "oklch(0.28 0.06 50)"}`,
        boxShadow: highlight ? "0 0 20px oklch(0.72 0.16 75 / 20%)" : "none",
      }}
    >
      {highlight && (
        <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10"
          style={{ background: "oklch(0.72 0.16 75)" }} />
      )}
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="opacity-70">{icon}</span>}
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>{label}</p>
      </div>
      <div className="flex items-end gap-1">
        <p className="text-xl font-black" style={{
          color: highlight ? "oklch(0.88 0.18 80)" : "oklch(0.88 0.03 70)",
          fontFamily: "'Playfair Display', serif",
          textShadow: highlight ? "0 0 20px oklch(0.72 0.16 75 / 60%)" : "none",
        }}>{value}</p>
        {trend === "down" && <TrendingDown className="w-3.5 h-3.5 mb-1" style={{ color: "oklch(0.65 0.14 145)" }} />}
        {trend === "up" && <TrendingUp className="w-3.5 h-3.5 mb-1" style={{ color: "oklch(0.65 0.18 25)" }} />}
        {trend === "flat" && <Minus className="w-3.5 h-3.5 mb-1" style={{ color: "oklch(0.52 0.05 60)" }} />}
      </div>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>{sub}</p>}
    </div>
  );
}

function ImprovementBadge({ pct, isTimed }: { pct: number | null; isTimed: boolean }) {
  if (pct == null) return null;
  const improved = isTimed ? pct < 0 : pct > 0;
  const label = improved ? `${Math.abs(pct).toFixed(1)}% better` : `${Math.abs(pct).toFixed(1)}% off`;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{
        background: improved ? "oklch(0.65 0.14 145 / 20%)" : "oklch(0.65 0.18 25 / 20%)",
        color: improved ? "oklch(0.65 0.14 145)" : "oklch(0.65 0.18 25)",
        border: `1px solid ${improved ? "oklch(0.65 0.14 145 / 40%)" : "oklch(0.65 0.18 25 / 40%)"}`,
      }}
    >
      {improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
function TimeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs"
      style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 40%)", color: "oklch(0.88 0.03 70)" }}>
      <p className="font-bold">{label}</p>
      <p style={{ color: "oklch(0.88 0.18 80)" }}>{payload[0].value.toFixed(3)}s</p>
    </div>
  );
}

function ScoreTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs"
      style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 40%)", color: "oklch(0.88 0.03 70)" }}>
      <p className="font-bold">{label}</p>
      <p style={{ color: "oklch(0.88 0.18 80)" }}>{payload[0].value.toFixed(1)} pts</p>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────
function PerformanceTab({ discipline, period }: { discipline: string; period: Period }) {
  const { data: summary, isLoading } = trpc.analytics.summary.useQuery({
    discipline: discipline === "all" ? undefined : discipline as Discipline,
    period,
  });
  const [showAllRuns, setShowAllRuns] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>;
  }

  if (!summary || summary.totalRuns === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm font-medium" style={{ color: "oklch(0.62 0.05 65)" }}>No runs recorded for this period</p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 55)" }}>Log your first run to see your stats</p>
      </div>
    );
  }

  // Group runs by discipline for per-discipline stats
  const runsByDiscipline: Record<string, typeof summary.chartData> = {};
  summary.chartData.forEach((r) => {
    if (!runsByDiscipline[r.discipline]) runsByDiscipline[r.discipline] = [];
    runsByDiscipline[r.discipline]!.push(r);
  });

  const disciplinesWithRuns = Object.keys(runsByDiscipline) as Discipline[];

  // For single-discipline view: show chart only if it makes sense
  const isSingleDiscipline = discipline !== "all";
  const singleRuns = isSingleDiscipline ? (runsByDiscipline[discipline] ?? []) : [];
  const singleTimedRuns = singleRuns.filter((r) => r.time != null).sort((a, b) => a.date - b.date);
  const singleScoredRuns = singleRuns.filter((r) => r.score != null).sort((a, b) => a.date - b.date);
  const chartTimeData = singleTimedRuns.map((r) => ({ date: format(new Date(r.date), "MMM d"), time: parseFloat((r.time as number).toFixed(3)) }));
  const chartScoreData = singleScoredRuns.map((r) => ({ date: format(new Date(r.date), "MMM d"), score: r.score }));

  // Sorted run history (newest first)
  const sortedRuns = [...summary.chartData].sort((a, b) => b.date - a.date);
  const visibleRuns = showAllRuns ? sortedRuns : sortedRuns.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total Runs" value={String(summary.totalRuns)} icon={<Target className="w-3 h-3" />} />
        {summary.bestTime != null && (
          <StatCard label="Best Time" value={formatTime(summary.bestTime)} trend="down" highlight icon={<Award className="w-3 h-3" />} />
        )}
        {summary.avgTime != null && (
          <StatCard label="Avg Time" value={formatTime(summary.avgTime)} />
        )}
        {summary.bestScore != null && (
          <StatCard label="Best Score" value={formatScore(summary.bestScore)} trend="up" highlight icon={<Star className="w-3 h-3" />} />
        )}
        {summary.avgScore != null && (
          <StatCard label="Avg Score" value={formatScore(summary.avgScore)} />
        )}
      </div>

      {/* Per-discipline breakdown — only shown in "All Disciplines" view */}
      {!isSingleDiscipline && disciplinesWithRuns.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide px-1" style={{ color: "oklch(0.52 0.05 60)" }}>By Discipline</p>
          {disciplinesWithRuns.map((disc) => {
            const runs = runsByDiscipline[disc] ?? [];
            const isTimed = runs.some((r) => r.time != null);
            const timedVals = runs.filter((r) => r.time != null).map((r) => r.time as number);
            const scoredVals = runs.filter((r) => r.score != null).map((r) => r.score as number);
            const best = isTimed
              ? (timedVals.length ? formatTime(Math.min(...timedVals)) : "—")
              : (scoredVals.length ? formatScore(Math.max(...scoredVals)) : "—");
            const colors = DISCIPLINE_COLORS[disc];
            const totalWon = runs.reduce((s, r) => s + (r.prizeMoneyCents ?? 0), 0);
            return (
              <div key={disc} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${colors.bg}`}>
                  {DISCIPLINE_ICONS[disc]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.88 0.03 70)" }}>{DISCIPLINE_LABELS[disc]}</p>
                  <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>{runs.length} run{runs.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.18 80)" }}>{best}</p>
                  {totalWon > 0 && <p className="text-xs" style={{ color: "oklch(0.65 0.18 145)" }}>💰 ${(totalWon / 100).toFixed(2)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single-discipline time trend chart */}
      {isSingleDiscipline && chartTimeData.length > 1 && (
        <div className="rounded-xl p-4 relative overflow-hidden"
          style={{ background: "oklch(0.16 0.05 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.16 75), transparent 70%)" }} />
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
              {DISCIPLINE_LABELS[discipline as Discipline]} — Time Trend
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.72 0.16 75)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
              Lower = Better
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartTimeData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.06 50)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} domain={["auto", "auto"]} />
              <Tooltip content={<TimeTooltip />} />
              <Area type="monotone" dataKey="time" stroke="#d97706" strokeWidth={2.5} fill="url(#timeGrad)"
                dot={{ r: 4, fill: "#d97706", stroke: "oklch(0.16 0.05 48)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#d97706" }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Single-discipline score trend chart */}
      {isSingleDiscipline && chartScoreData.length > 1 && (
        <div className="rounded-xl p-4 relative overflow-hidden"
          style={{ background: "oklch(0.16 0.05 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.65 0.18 145), transparent 70%)" }} />
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
              {DISCIPLINE_LABELS[discipline as Discipline]} — Score Trend
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "oklch(0.65 0.18 145 / 15%)", color: "oklch(0.65 0.18 145)", border: "1px solid oklch(0.65 0.18 145 / 30%)" }}>
              Higher = Better
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartScoreData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.06 50)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} domain={["auto", "auto"]} />
              <Tooltip content={<ScoreTooltip />} />
              <Area type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2.5} fill="url(#scoreGrad)"
                dot={{ r: 4, fill: "#16a34a", stroke: "oklch(0.16 0.05 48)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#16a34a" }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full run history with context */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.28 0.06 50)" }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "oklch(0.20 0.05 48)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Run History</p>
          <span className="text-[10px]" style={{ color: "oklch(0.42 0.04 55)" }}>{sortedRuns.length} total</span>
        </div>
        <div className="divide-y" style={{ borderColor: "oklch(0.25 0.05 50)" }}>
          {visibleRuns.map((run, i) => {
            const isTimed = run.time != null;
            const colors = DISCIPLINE_COLORS[run.discipline as Discipline] ?? { bg: "bg-muted", text: "text-muted-foreground", accent: "#888" };
            return (
              <div key={run.id ?? i} className="px-4 py-3" style={{ background: "oklch(0.16 0.04 48)" }}>
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${colors.bg}`}>
                    {DISCIPLINE_ICONS[run.discipline as Discipline]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>
                        {DISCIPLINE_LABELS[run.discipline as Discipline]}
                      </span>
                      {run.round && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.72 0.16 75)" }}>
                          {run.round}
                        </span>
                      )}
                      {(run.prizeMoneyCents ?? 0) > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "oklch(0.65 0.18 145 / 20%)", color: "oklch(0.65 0.18 145)" }}>
                          💰 ${((run.prizeMoneyCents ?? 0) / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.62 0.05 65)" }}>
                      {run.rodeoName} · {format(new Date(run.date), "MMM d, yyyy")}
                    </p>
                    {run.notes && (
                      <p className="text-xs mt-1 italic" style={{ color: "oklch(0.52 0.05 60)" }}>{run.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isTimed && (
                      <p className="text-base font-black" style={{ color: "oklch(0.88 0.18 80)" }}>
                        {(run.time as number).toFixed(3)}s
                      </p>
                    )}
                    {run.score != null && (
                      <p className="text-base font-black" style={{ color: "oklch(0.65 0.18 145)" }}>
                        {run.score.toFixed(1)} pts
                      </p>
                    )}
                    {run.penaltySeconds != null && run.penaltySeconds > 0 && (
                      <p className="text-[10px]" style={{ color: "oklch(0.65 0.18 25)" }}>+{run.penaltySeconds}s pen.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {sortedRuns.length > 10 && (
          <button
            onClick={() => setShowAllRuns(!showAllRuns)}
            className="w-full py-2.5 text-xs font-semibold"
            style={{ background: "oklch(0.18 0.04 48)", color: "oklch(0.72 0.16 75)", borderTop: "1px solid oklch(0.25 0.05 50)" }}
          >
            {showAllRuns ? "Show Less" : `Show All ${sortedRuns.length} Runs`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab({ period }: { period: Period }) {
  const { data: allExpenses, isLoading } = trpc.expenses.listAll.useQuery();
  const { data: rodeos } = trpc.rodeos.list.useQuery();

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>;
  }

  const now = Date.now();
  const msMap = { week: 7, month: 30, year: 365, all: 99999 };
  const cutoff = now - msMap[period] * 24 * 60 * 60 * 1000;
  const filtered = allExpenses?.filter((e) => new Date(e.date).getTime() >= cutoff) ?? [];

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">💰</div>
        <p className="text-sm font-medium" style={{ color: "oklch(0.62 0.05 65)" }}>No expenses for this period</p>
      </div>
    );
  }

  const total = filtered.reduce((s, e) => s + e.amountCents, 0);
  const byCategory: Record<string, number> = {};
  filtered.forEach((e) => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amountCents; });
  const pieData = Object.entries(byCategory)
    .map(([cat, cents]) => ({
      name: `${EXPENSE_CATEGORY_ICONS[cat as ExpenseCategory]} ${EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}`,
      value: cents / 100,
      pct: Math.round((cents / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);

  const byRodeo: Record<number, number> = {};
  filtered.forEach((e) => { byRodeo[e.rodeoId] = (byRodeo[e.rodeoId] ?? 0) + e.amountCents; });
  const rodeoMap = Object.fromEntries((rodeos ?? []).map((r) => [r.id, r.name]));
  const rodeoData = Object.entries(byRodeo)
    .map(([id, cents]) => ({ name: rodeoMap[parseInt(id)] ?? `Rodeo #${id}`, value: cents / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.20 0.07 30), oklch(0.16 0.05 40))", border: "1px solid oklch(0.65 0.18 25 / 40%)" }}>
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.65 0.18 25), transparent 70%)" }} />
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "oklch(0.65 0.18 25 / 70%)" }}>Total Spent</p>
        <p className="text-4xl font-black" style={{ color: "oklch(0.88 0.18 25)", fontFamily: "'Playfair Display', serif", textShadow: "0 0 30px oklch(0.65 0.18 25 / 50%)" }}>
          {formatDollars(total)}
        </p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.05 60)" }}>
          Across {Object.keys(byRodeo).length} rodeo{Object.keys(byRodeo).length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-xl p-4" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
        <p className="text-sm font-bold mb-3" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
          Spending by Category
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip
              formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
              contentStyle={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.32 0.07 55)", borderRadius: 8, fontSize: 12 }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.28 0.06 50)" }}>
        <div className="px-4 py-2" style={{ background: "oklch(0.20 0.05 48)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Category Breakdown</p>
        </div>
        <div className="divide-y" style={{ borderColor: "oklch(0.25 0.05 50)" }}>
          {pieData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3 px-4 py-3" style={{ background: "oklch(0.16 0.04 48)" }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-xs flex-1" style={{ color: "oklch(0.78 0.03 70)" }}>{item.name}</span>
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.28 0.06 50)" }}>
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
              <span className="text-xs font-bold w-12 text-right" style={{ color: "oklch(0.88 0.03 70)" }}>${item.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {rodeoData.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.28 0.06 50)" }}>
          <div className="px-4 py-2" style={{ background: "oklch(0.20 0.05 48)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Top Expenses by Rodeo</p>
          </div>
          <div className="divide-y" style={{ borderColor: "oklch(0.25 0.05 50)" }}>
            {rodeoData.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3" style={{ background: "oklch(0.16 0.04 48)" }}>
                <span className="text-xs font-bold w-4" style={{ color: "oklch(0.52 0.05 60)" }}>#{i + 1}</span>
                <span className="text-xs flex-1 truncate" style={{ color: "oklch(0.78 0.03 70)" }}>{r.name}</span>
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.28 0.06 50)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(r.value / rodeoData[0].value) * 100}%`, background: "#d97706" }} />
                </div>
                <span className="text-xs font-bold w-14 text-right" style={{ color: "oklch(0.88 0.18 80)" }}>${r.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Financials Tab ───────────────────────────────────────────────────────────
function FinancialsTab({ period }: { period: Period }) {
  const { data: fin, isLoading } = trpc.analytics.financials.useQuery({ period });
  const { data: allRuns } = trpc.performances.list.useQuery();
  const { data: allExpenses } = trpc.expenses.listAll.useQuery();
  const { data: seasonGoal } = trpc.seasonGoals.get.useQuery({ year: new Date().getFullYear() });

  const handleDownloadReport = () => {
    if (!fin) return;
    const year = new Date().getFullYear();
    const net = fin.netTotal;
    const isProfit = net >= 0;
    const roi = fin.totalExpenses > 0 ? ((fin.totalWinnings - fin.totalExpenses) / fin.totalExpenses) * 100 : null;
    const goalTarget = seasonGoal?.targetCents ?? 0;
    const goalPct = goalTarget > 0 ? Math.min(100, Math.round((fin.totalWinnings / goalTarget) * 100)) : null;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Rodeo Companion — ${year} Season Report</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
  h1 { font-size: 2rem; border-bottom: 3px solid #d97706; padding-bottom: 8px; color: #92400e; }
  h2 { font-size: 1.2rem; color: #78350f; margin-top: 28px; border-left: 4px solid #d97706; padding-left: 10px; }
  .hero { background: #fef3c7; border: 2px solid #d97706; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
  .hero .net { font-size: 3rem; font-weight: bold; color: ${isProfit ? "#16a34a" : "#dc2626"}; }
  .hero .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: #78350f; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
  .stat { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; }
  .stat .val { font-size: 1.5rem; font-weight: bold; }
  .stat .lbl { font-size: 0.75rem; color: #78350f; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.9rem; }
  th { background: #fef3c7; padding: 8px 12px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #78350f; }
  td { padding: 8px 12px; border-bottom: 1px solid #fde68a; }
  .profit { color: #16a34a; font-weight: bold; }
  .loss { color: #dc2626; font-weight: bold; }
  .footer { margin-top: 40px; font-size: 0.75rem; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>🤠 Rodeo Companion — ${year} Season Report</h1>
<p style="color:#78350f">Generated ${new Date().toLocaleDateString()} · Period: ${period === "all" ? "All Time" : period === "year" ? "This Year" : period === "month" ? "This Month" : "This Week"}</p>

<div class="hero">
  <div class="label">Net P&amp;L</div>
  <div class="net">${isProfit ? "+" : ""}$${(net / 100).toFixed(2)}</div>
  ${roi != null ? `<div style="color:#78350f;margin-top:6px">ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%</div>` : ""}
  ${goalPct != null ? `<div style="color:#78350f;margin-top:4px">${year} Goal Progress: ${goalPct}% of $${(goalTarget / 100).toLocaleString()}</div>` : ""}
</div>

<div class="grid">
  <div class="stat">
    <div class="lbl">Total Prize Money Won</div>
    <div class="val" style="color:#16a34a">$${(fin.totalWinnings / 100).toFixed(2)}</div>
  </div>
  <div class="stat">
    <div class="lbl">Total Expenses</div>
    <div class="val" style="color:#dc2626">$${(fin.totalExpenses / 100).toFixed(2)}</div>
  </div>
  <div class="stat">
    <div class="lbl">Total Runs</div>
    <div class="val">${allRuns?.length ?? 0}</div>
  </div>
  <div class="stat">
    <div class="lbl">Rodeos Entered</div>
    <div class="val">${fin.perRodeo.length}</div>
  </div>
</div>

${fin.perRodeo.length > 0 ? `
<h2>Per-Rodeo Breakdown</h2>
<table>
  <thead><tr><th>Rodeo</th><th>Won</th><th>Spent</th><th>Net</th></tr></thead>
  <tbody>
    ${fin.perRodeo.map(r => {
      const rNet = r.netCents;
      const cls = rNet >= 0 ? "profit" : "loss";
      return `<tr><td>${r.rodeoName}</td><td class="profit">$${(r.winningsCents/100).toFixed(2)}</td><td class="loss">$${(r.expensesCents/100).toFixed(2)}</td><td class="${cls}">${rNet >= 0 ? "+" : ""}$${(rNet/100).toFixed(2)}</td></tr>`;
    }).join("")}
  </tbody>
</table>
` : ""}

<div class="footer">Rodeo Companion — Your Season at a Glance · Printed from rodeocompanion.app</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => { win.print(); };
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>;
  }

  if (!fin || (fin.totalWinnings === 0 && fin.totalExpenses === 0)) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">💵</div>
        <p className="text-sm font-medium" style={{ color: "oklch(0.62 0.05 65)" }}>No financial data for this period</p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 55)" }}>Log runs with prize money and add expenses to see your P&amp;L</p>
      </div>
    );
  }

  const net = fin.netTotal;
  const isProfit = net >= 0;
  const roi = fin.totalExpenses > 0 ? ((fin.totalWinnings - fin.totalExpenses) / fin.totalExpenses) * 100 : null;

  const chartData = fin.chartData.map((d) => ({
    month: d.month,
    Winnings: parseFloat((d.winnings / 100).toFixed(2)),
    Expenses: parseFloat((d.expenses / 100).toFixed(2)),
    Net: parseFloat(((d.winnings - d.expenses) / 100).toFixed(2)),
  }));

  return (
    <div className="space-y-4">
      {/* Download Report button */}
      <button
        onClick={handleDownloadReport}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, oklch(0.22 0.08 55), oklch(0.18 0.06 50))",
          border: "1px solid oklch(0.72 0.16 75 / 50%)",
          color: "oklch(0.88 0.18 80)",
          boxShadow: "0 0 16px oklch(0.72 0.16 75 / 15%)",
        }}
      >
        <Download className="w-4 h-4" />
        Download Season Report (PDF)
      </button>

      <div className="rounded-xl p-5 text-center relative overflow-hidden"
        style={{
          background: isProfit
            ? "linear-gradient(135deg, oklch(0.18 0.07 145), oklch(0.14 0.05 140))"
            : "linear-gradient(135deg, oklch(0.20 0.07 30), oklch(0.16 0.05 40))",
          border: `1px solid ${isProfit ? "oklch(0.65 0.18 145 / 50%)" : "oklch(0.65 0.18 25 / 50%)"}`,
          boxShadow: isProfit ? "0 0 30px oklch(0.65 0.18 145 / 20%)" : "0 0 30px oklch(0.65 0.18 25 / 20%)",
        }}>
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${isProfit ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.18 25)"}, transparent 70%)` }} />
        <div className="flex items-center justify-center gap-2 mb-1">
          {isProfit
            ? <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.65 0.18 145)" }} />
            : <TrendingDown className="w-5 h-5" style={{ color: "oklch(0.65 0.18 25)" }} />}
          <p className="text-xs font-bold uppercase tracking-widest"
            style={{ color: isProfit ? "oklch(0.65 0.18 145 / 80%)" : "oklch(0.65 0.18 25 / 80%)" }}>
            Net P&amp;L
          </p>
        </div>
        <p className="text-5xl font-black" style={{
          color: isProfit ? "oklch(0.75 0.18 145)" : "oklch(0.75 0.18 25)",
          fontFamily: "'Playfair Display', serif",
          textShadow: `0 0 40px ${isProfit ? "oklch(0.65 0.18 145 / 60%)" : "oklch(0.65 0.18 25 / 60%)"}`,
        }}>
          {isProfit ? "+" : ""}{(net / 100).toFixed(2)}
        </p>
        {roi != null && (
          <p className="text-xs mt-2 font-bold" style={{ color: isProfit ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.18 25)" }}>
            ROI: {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.65 0.18 145 / 30%)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "oklch(0.65 0.18 145 / 70%)" }}>Total Won</p>
          <p className="text-xl font-black" style={{ color: "oklch(0.65 0.18 145)", fontFamily: "'Playfair Display', serif" }}>
            ${(fin.totalWinnings / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.65 0.18 25 / 30%)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "oklch(0.65 0.18 25 / 70%)" }}>Total Spent</p>
          <p className="text-xl font-black" style={{ color: "oklch(0.65 0.18 25)", fontFamily: "'Playfair Display', serif" }}>
            ${(fin.totalExpenses / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl p-4 relative overflow-hidden"
          style={{ background: "oklch(0.16 0.05 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
            Winnings vs Expenses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.06 50)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <Tooltip
                contentStyle={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.32 0.07 55)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Winnings" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="rounded-xl p-4 relative overflow-hidden"
          style={{ background: "oklch(0.16 0.05 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
            Net P&amp;L Trend
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.06 50)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <Tooltip
                contentStyle={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.32 0.07 55)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Net P&L"]}
              />
              <Area type="monotone" dataKey="Net" stroke="#d97706" strokeWidth={2.5} fill="url(#netGrad)"
                dot={{ r: 4, fill: "#d97706", stroke: "oklch(0.16 0.05 48)", strokeWidth: 2 }}
                activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {fin.perRodeo.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.28 0.06 50)" }}>
          <div className="px-4 py-2.5" style={{ background: "oklch(0.20 0.05 48)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Per-Rodeo Breakdown</p>
          </div>
          <div className="divide-y" style={{ borderColor: "oklch(0.25 0.05 50)" }}>
            {fin.perRodeo.map((r) => {
              const rNet = r.netCents;
              const rIsProfit = rNet >= 0;
              return (
                <div key={r.rodeoId} className="flex items-center gap-3 px-4 py-3" style={{ background: "oklch(0.16 0.04 48)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "oklch(0.88 0.03 70)" }}>{r.rodeoName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: "oklch(0.65 0.18 145)" }}>Won: ${(r.winningsCents / 100).toFixed(2)}</span>
                      <span className="text-xs" style={{ color: "oklch(0.65 0.18 25)" }}>Spent: ${(r.expensesCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0"
                    style={{ color: rIsProfit ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.18 25)" }}>
                    {rIsProfit ? "+" : ""}{(rNet / 100).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drill AI Card ────────────────────────────────────────────────────────────
function DrillCard({ drill }: { drill: { title: string; description: string; difficulty: string; duration: string } }) {
  const diffStyle = drill.difficulty === "beginner"
    ? { bg: "oklch(0.65 0.14 145 / 20%)", color: "oklch(0.65 0.14 145)" }
    : drill.difficulty === "intermediate"
    ? { bg: "oklch(0.72 0.16 75 / 20%)", color: "oklch(0.78 0.18 80)" }
    : { bg: "oklch(0.65 0.18 25 / 20%)", color: "oklch(0.72 0.22 28)" };
  return (
    <div className="rounded-xl p-4" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-black text-sm" style={{ color: "oklch(0.93 0.03 75)", fontFamily: "'Playfair Display', serif" }}>{drill.title}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wide flex-shrink-0"
          style={{ background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.color}40` }}>
          {drill.difficulty}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.05 65)" }}>{drill.description}</p>
      <p className="text-xs mt-2 font-bold" style={{ color: "oklch(0.72 0.16 75)" }}>⏱ {drill.duration}</p>
    </div>
  );
}

// ─── Video Link Card ──────────────────────────────────────────────────────────
function VideoLinkCard({ video, index }: { video: { title: string; url: string; description: string }; index: number }) {
  const accentColors = ["#d97706", "#16a34a", "#0d9488"];
  const accent = accentColors[index % accentColors.length];

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-4 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "oklch(0.18 0.04 48)",
        border: `1px solid ${accent}40`,
        textDecoration: "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
          <Play className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-black text-sm leading-tight" style={{ color: "oklch(0.93 0.03 75)", fontFamily: "'Playfair Display', serif" }}>
              {video.title}
            </h4>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "oklch(0.62 0.05 65)" }}>{video.description}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-bold" style={{ color: accent }}>Search on YouTube →</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Drills Tab ───────────────────────────────────────────────────────────────
function DrillsTab({ discipline }: { discipline: string }) {
  const { data: drills, isLoading, refetch } = trpc.drills.getSuggestions.useQuery(
    { discipline: discipline === "all" ? "barrel_racing" : discipline as Discipline },
    { enabled: discipline !== "all" }
  );

  if (discipline === "all") {
    return (
      <div className="text-center py-12">
        <Dumbbell className="w-10 h-10 mx-auto mb-2" style={{ color: "oklch(0.42 0.04 55)" }} />
        <p className="text-sm font-medium" style={{ color: "oklch(0.62 0.05 65)" }}>Select a specific discipline</p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 55)" }}>Choose a discipline above to see drill suggestions and video links</p>
      </div>
    );
  }

  const videos = DISCIPLINE_DRILL_VIDEOS[discipline as Discipline] ?? [];
  const disciplineLabel = DISCIPLINE_LABELS[discipline as Discipline];
  const disciplineIcon = DISCIPLINE_ICONS[discipline as Discipline];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-1">
        <span className="text-2xl">{disciplineIcon}</span>
        <div>
          <p className="text-sm font-black" style={{ color: "oklch(0.88 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
            {disciplineLabel}
          </p>
          <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Training resources &amp; AI drill suggestions</p>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-4 h-3 rounded-sm flex items-center justify-center" style={{ background: "#ff0000" }}>
              <span className="text-[6px] text-white font-bold leading-none">▶</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>
              Training Videos
            </p>
          </div>
          {videos.map((video, i) => (
            <VideoLinkCard key={i} video={video} index={i} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.16 75)" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>
              AI Drill Suggestions
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} />
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Generating personalized drills…</p>
          </div>
        ) : !drills?.length ? (
          <div className="text-center py-6">
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>No drills available</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : (
          drills.map((drill, i) => <DrillCard key={i} drill={drill} />)
        )}
      </div>
    </div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function Analytics() {
  const [period, setPeriod] = useState<Period>("month");
  const [discipline, setDiscipline] = useState("all");

  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="hero-western relative px-4 pt-10 pb-6">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">📊</div>
        <div className="absolute top-8 right-14 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute top-5 left-6 text-xs opacity-10 select-none pointer-events-none">★</div>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1"
            style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Analytics ✦</p>
          <h1 className="text-3xl font-black leading-none mb-1"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
            Progress
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>Charts, P&amp;L, expenses &amp; drill videos</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger className="text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Disciplines</SelectItem>
              {DISCIPLINES.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">{DISCIPLINE_ICONS[d]} {DISCIPLINE_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="performance">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="performance" className="text-xs">Runs</TabsTrigger>
            <TabsTrigger value="financials" className="text-xs">P&amp;L</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs">Expenses</TabsTrigger>
            <TabsTrigger value="drills" className="text-xs">Drills</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="mt-4">
            <PerformanceTab discipline={discipline} period={period} />
          </TabsContent>
          <TabsContent value="financials" className="mt-4">
            <FinancialsTab period={period} />
          </TabsContent>
          <TabsContent value="expenses" className="mt-4">
            <ExpensesTab period={period} />
          </TabsContent>
          <TabsContent value="drills" className="mt-4">
            <DrillsTab discipline={discipline} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
