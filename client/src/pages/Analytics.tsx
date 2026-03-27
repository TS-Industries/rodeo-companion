import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";
import { BarChart3, TrendingDown, TrendingUp, Minus, Dumbbell, DollarSign, Loader2, Trophy } from "lucide-react";
import {
  DISCIPLINES, DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_COLORS,
  isTimedDiscipline, formatTime, formatScore, type Discipline,
} from "@/lib/disciplines";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS, formatDollars, type ExpenseCategory } from "@/lib/expenses";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
] as const;

type Period = "week" | "month" | "year" | "all";

const CHART_COLORS = ["#c2410c", "#0d9488", "#d97706", "#7c3aed", "#dc2626", "#2563eb", "#16a34a"];

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "flat" }) {
  return (
    <div className="stat-card">
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>{label}</p>
      <div className="flex items-end gap-1 mt-1">
        <p className="text-2xl font-black num-gold">{value}</p>
        {trend === "down" && <TrendingDown className="w-4 h-4 mb-1" style={{ color: "oklch(0.65 0.14 145)" }} />}
        {trend === "up" && <TrendingUp className="w-4 h-4 mb-1" style={{ color: "oklch(0.65 0.18 25)" }} />}
        {trend === "flat" && <Minus className="w-4 h-4 mb-1" style={{ color: "oklch(0.52 0.05 60)" }} />}
      </div>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>{sub}</p>}
    </div>
  );
}

function DrillCard({ drill }: { drill: { title: string; description: string; difficulty: string; duration: string } }) {
  const diffStyle = drill.difficulty === "beginner"
    ? { bg: "oklch(0.65 0.14 145 / 20%)", color: "oklch(0.65 0.14 145)" }
    : drill.difficulty === "intermediate"
    ? { bg: "oklch(0.72 0.16 75 / 20%)", color: "oklch(0.78 0.18 80)" }
    : { bg: "oklch(0.65 0.18 25 / 20%)", color: "oklch(0.72 0.22 28)" };
  return (
    <div className="card-shimmer rounded-xl p-4">
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

function PerformanceTab({ discipline, period }: { discipline: string; period: Period }) {
  const { data: summary, isLoading } = trpc.analytics.summary.useQuery({
    discipline: discipline === "all" ? undefined : discipline as Discipline,
    period,
  });

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!summary || summary.totalRuns === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No runs recorded for this period</p>
      </div>
    );
  }

  const chartData = [...summary.chartData]
    .sort((a, b) => a.date - b.date)
    .map((d) => ({
      date: format(new Date(d.date), "MMM d"),
      time: d.time != null ? parseFloat(d.time.toFixed(2)) : null,
      score: d.score,
    }));

  const hasTimes = chartData.some((d) => d.time != null);
  const hasScores = chartData.some((d) => d.score != null);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total Runs" value={String(summary.totalRuns)} />
        {hasTimes && (
          <>
            <StatCard label="Best Time" value={formatTime(summary.bestTime)} trend="down" />
            <StatCard label="Avg Time" value={formatTime(summary.avgTime)} />
          </>
        )}
        {hasScores && (
          <>
            <StatCard label="Best Score" value={formatScore(summary.bestScore)} trend="up" />
            <StatCard label="Avg Score" value={formatScore(summary.avgScore)} />
          </>
        )}
      </div>

      {/* Time chart */}
      {hasTimes && chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Time Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(2)}s`, "Time"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="time" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score chart */}
      {hasScores && chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Score Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)} pts`, "Score"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="score" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Single run (no chart) */}
      {chartData.length === 1 && (
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Add more runs to see your progress trend!</p>
        </div>
      )}
    </div>
  );
}

function ExpensesTab({ period }: { period: Period }) {
  const { data: allExpenses, isLoading } = trpc.expenses.listAll.useQuery();
  const { data: rodeos } = trpc.rodeos.list.useQuery();

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const now = Date.now();
  const msMap = { week: 7, month: 30, year: 365, all: 99999 };
  const cutoff = now - msMap[period] * 24 * 60 * 60 * 1000;
  const filtered = allExpenses?.filter((e) => new Date(e.date).getTime() >= cutoff) ?? [];

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No expenses for this period</p>
      </div>
    );
  }

  const total = filtered.reduce((s, e) => s + e.amountCents, 0);

  // By category
  const byCategory: Record<string, number> = {};
  filtered.forEach((e) => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amountCents; });
  const pieData = Object.entries(byCategory).map(([cat, cents]) => ({
    name: EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory],
    value: cents / 100,
    icon: EXPENSE_CATEGORY_ICONS[cat as ExpenseCategory],
  }));

  // By rodeo
  const byRodeo: Record<number, number> = {};
  filtered.forEach((e) => { byRodeo[e.rodeoId] = (byRodeo[e.rodeoId] ?? 0) + e.amountCents; });
  const rodeoMap = Object.fromEntries((rodeos ?? []).map((r) => [r.id, r.name]));
  const rodeoData = Object.entries(byRodeo)
    .map(([id, cents]) => ({ name: rodeoMap[parseInt(id)] ?? `Rodeo #${id}`, value: cents / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Spent" value={formatDollars(total)} />
        <StatCard label="Avg per Rodeo" value={formatDollars(Math.round(total / Math.max(Object.keys(byRodeo).length, 1)))} />
      </div>

      {/* Pie chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Spending by Category</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* By rodeo */}
      {rodeoData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Top Expenses by Rodeo</p>
          <div className="space-y-2">
            {rodeoData.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <span className="text-xs text-foreground flex-1 truncate">{r.name}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(r.value / rodeoData[0].value) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-foreground w-16 text-right">${r.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Financials Tab ──────────────────────────────────────────────────────────
function FinancialsTab({ period }: { period: Period }) {
  const { data: fin, isLoading } = trpc.analytics.financials.useQuery({ period });

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>;
  }

  if (!fin || (fin.totalWinnings === 0 && fin.totalExpenses === 0)) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: "oklch(0.42 0.04 55)" }} />
        <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>No financial data for this period</p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 55)" }}>Log runs with prize money and add expenses to see your P&amp;L</p>
      </div>
    );
  }

  const net = fin.netTotal;
  const isProfit = net >= 0;

  // Format chart data: convert cents to dollars
  const chartData = fin.chartData.map((d) => ({
    month: d.month,
    Winnings: parseFloat((d.winnings / 100).toFixed(2)),
    Expenses: parseFloat((d.expenses / 100).toFixed(2)),
    Net: parseFloat(((d.winnings - d.expenses) / 100).toFixed(2)),
  }));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card-western rounded-xl p-3">
          <p className="text-xs" style={{ color: "oklch(0.62 0.05 65)" }}>Total Won</p>
          <p className="text-lg font-bold" style={{ color: "oklch(0.65 0.18 145)" }}>${(fin.totalWinnings / 100).toFixed(2)}</p>
        </div>
        <div className="card-western rounded-xl p-3">
          <p className="text-xs" style={{ color: "oklch(0.62 0.05 65)" }}>Total Spent</p>
          <p className="text-lg font-bold" style={{ color: "oklch(0.65 0.18 25)" }}>${(fin.totalExpenses / 100).toFixed(2)}</p>
        </div>
        <div className="card-western rounded-xl p-3">
          <p className="text-xs" style={{ color: "oklch(0.62 0.05 65)" }}>Net P&amp;L</p>
          <p className="text-lg font-bold" style={{ color: isProfit ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.18 25)" }}>
            {isProfit ? "+" : ""}{(net / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Winnings vs Expenses bar chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.78 0.18 80)" }}>Winnings vs Expenses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.06 50)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <Tooltip
                contentStyle={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.32 0.07 55)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Winnings" fill="oklch(0.65 0.18 145)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="oklch(0.65 0.18 25)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Net P&L line chart */}
      {chartData.length > 1 && (
        <div className="rounded-xl p-4" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.78 0.18 80)" }}>Net P&amp;L Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.06 50)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.52 0.05 60)" }} />
              <Tooltip
                contentStyle={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.32 0.07 55)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Net P&L"]}
              />
              <Line type="monotone" dataKey="Net" stroke="oklch(0.72 0.16 75)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-rodeo P&L table */}
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
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: rIsProfit ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.18 25)" }}>
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

function DrillsTab({ discipline }: { discipline: string }) {
  const { data: drills, isLoading, refetch } = trpc.drills.getSuggestions.useQuery(
    { discipline: discipline === "all" ? "barrel_racing" : discipline as Discipline },
    { enabled: discipline !== "all" }
  );

  if (discipline === "all") {
    return (
      <div className="text-center py-12">
        <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Select a specific discipline to see drill suggestions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating drill suggestions…</p>
      </div>
    );
  }

  if (!drills?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">No drills available</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          AI-powered drills for {DISCIPLINE_LABELS[discipline as Discipline]}
        </p>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => refetch()}>Refresh</Button>
      </div>
      {drills.map((drill, i) => <DrillCard key={i} drill={drill} />)}
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("month");
  const [discipline, setDiscipline] = useState("all");

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* ── Flashy Hero Header ── */}
      <div className="hero-western relative px-4 pt-10 pb-6">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">📊</div>
        <div className="absolute top-8 right-14 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute top-5 left-6 text-xs opacity-10 select-none pointer-events-none">★</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Analytics ✦</p>
          <h1 className="text-3xl font-black leading-none mb-1"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
            Progress
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>Charts, P&amp;L, expenses &amp; drill suggestions</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filters */}
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

        {/* Tabs */}
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
