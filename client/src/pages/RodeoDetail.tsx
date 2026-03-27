import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, CalendarDays, Bell, CheckCircle2, Plus, Trash2,
  Clock, DollarSign, ChevronRight, Fuel, Calculator
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_COLORS,
  RODEO_TYPE_LABELS, isTimedDiscipline, formatTime, formatScore,
  type Discipline, type RodeoType,
} from "@/lib/disciplines";
import {
  EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS, EXPENSE_CATEGORY_COLORS, formatDollars,
  type ExpenseCategory,
} from "@/lib/expenses";
import { cn } from "@/lib/utils";

// ─── Trip Budget Calculator ───────────────────────────────────────────────────
function TripBudgetCalc({ distanceKm, countryCode }: { distanceKm?: number | null; countryCode?: string | null }) {
  const isCanada = countryCode === "CA";
  const [fuelPrice, setFuelPrice] = useState(isCanada ? "1.65" : "3.50"); // CAD/L or USD/gal
  const [economy, setEconomy] = useState(isCanada ? "15" : "12"); // L/100km or MPG

  const distance = distanceKm ?? 0;
  let fuelCost = 0;
  let fuelUsed = 0;
  let displayDist = "";

  if (isCanada) {
    displayDist = `${distance.toFixed(0)} km`;
    fuelUsed = (distance / 100) * parseFloat(economy || "15");
    fuelCost = fuelUsed * parseFloat(fuelPrice || "1.65");
  } else {
    const miles = distance * 0.621371;
    displayDist = `${miles.toFixed(0)} mi`;
    fuelUsed = miles / parseFloat(economy || "12");
    fuelCost = fuelUsed * parseFloat(fuelPrice || "3.50");
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.32 0.07 55)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Trip Budget Calculator</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
            {isCanada ? "Fuel Price (CAD/L)" : "Fuel Price (USD/gal)"}
          </Label>
          <Input className="mt-1 text-sm" type="number" step="0.01" min="0" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
            {isCanada ? "Fuel Economy (L/100km)" : "Fuel Economy (MPG)"}
          </Label>
          <Input className="mt-1 text-sm" type="number" step="0.1" min="1" value={economy} onChange={(e) => setEconomy(e.target.value)} />
        </div>
      </div>
      {distance > 0 ? (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center p-2 rounded-lg" style={{ background: "oklch(0.16 0.04 48)" }}>
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Distance</p>
            <p className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>{displayDist}</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: "oklch(0.16 0.04 48)" }}>
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Fuel Used</p>
            <p className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>
              {isCanada ? `${fuelUsed.toFixed(1)}L` : `${fuelUsed.toFixed(1)}gal`}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: "oklch(0.16 0.04 48)" }}>
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Est. Cost</p>
            <p className="text-sm font-bold" style={{ color: "oklch(0.72 0.16 75)" }}>
              {isCanada ? `C$${fuelCost.toFixed(2)}` : `$${fuelCost.toFixed(2)}`}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-center" style={{ color: "oklch(0.42 0.04 55)" }}>
          Enter a distance in the rodeo details to calculate fuel cost
        </p>
      )}
    </div>
  );
}

// ─── Add Expense Dialog ───────────────────────────────────────────────────────
function AddExpenseDialog({ rodeoId, open, onClose }: { rodeoId: number; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => { utils.expenses.listByRodeo.invalidate({ rodeoId }); toast.success("Expense added!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const [form, setForm] = useState({
    category: "entry_fee" as ExpenseCategory,
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = () => {
    const cents = Math.round(parseFloat(form.amount) * 100);
    if (!form.amount || isNaN(cents) || cents < 0) { toast.error("Enter a valid amount"); return; }
    createMutation.mutate({
      rodeoId,
      category: form.category,
      description: form.description || undefined,
      amountCents: cents,
      date: new Date(form.date).getTime(),
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
            Add Expense
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {EXPENSE_CATEGORY_ICONS[c]} {EXPENSE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Description</Label>
            <Input className="mt-1" placeholder={`e.g. ${EXPENSE_CATEGORY_LABELS[form.category]}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Amount *</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>$</span>
              <Input className="pl-7" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Date</Label>
            <Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
            <Input className="mt-1" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending} className="btn-gold">
            {createMutation.isPending ? "Saving…" : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Expenses List ────────────────────────────────────────────────────────────
function ExpensesList({ rodeoId, countryCode }: { rodeoId: number; countryCode?: string | null }) {
  const utils = trpc.useUtils();
  const { data: expenseList, isLoading } = trpc.expenses.listByRodeo.useQuery({ rodeoId });
  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => utils.expenses.listByRodeo.invalidate({ rodeoId }),
    onError: (e) => toast.error(e.message),
  });
  const [showAdd, setShowAdd] = useState(false);

  const total = expenseList?.reduce((s, e) => s + e.amountCents, 0) ?? 0;
  const isCanada = countryCode === "CA";

  // Group by category
  const byCategory: Record<string, typeof expenseList> = {};
  expenseList?.forEach((e) => {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category]!.push(e);
  });

  return (
    <div className="space-y-4">
      {/* Total + Add */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Total Expenses</p>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
            {isCanada ? "C" : ""}${(total / 100).toFixed(2)}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="btn-gold gap-1 h-8 px-3 rounded-full text-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {/* Category quick-add buttons */}
      <div className="flex flex-wrap gap-2">
        {(["fuel", "entry_fee", "food", "lodging", "repairs", "vet"] as ExpenseCategory[]).map((cat) => {
          const c = EXPENSE_CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => setShowAdd(true)}
              className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all", c.bg, c.text)}
            >
              {EXPENSE_CATEGORY_ICONS[cat]} {EXPENSE_CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />)}</div>
      ) : expenseList?.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ background: "oklch(0.18 0.04 48)", border: "1px dashed oklch(0.32 0.07 55)" }}>
          <DollarSign className="w-10 h-10 mx-auto mb-2" style={{ color: "oklch(0.42 0.04 55)" }} />
          <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>No expenses logged yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>Add First Expense</Button>
        </div>
      ) : (
        <>
          {/* Category breakdown */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: "oklch(0.20 0.05 48)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Breakdown</p>
            {Object.entries(byCategory).map(([cat, items]) => {
              const catTotal = items!.reduce((s, e) => s + e.amountCents, 0);
              const pct = total > 0 ? (catTotal / total) * 100 : 0;
              const c = EXPENSE_CATEGORY_COLORS[cat as ExpenseCategory];
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-base w-5 flex-shrink-0">{EXPENSE_CATEGORY_ICONS[cat as ExpenseCategory]}</span>
                  <span className="text-xs flex-1 min-w-0 truncate" style={{ color: "oklch(0.72 0.08 65)" }}>{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.28 0.06 50)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.accent }} />
                  </div>
                  <span className="text-xs font-semibold w-14 text-right" style={{ color: "oklch(0.78 0.18 80)" }}>
                    {isCanada ? "C" : ""}${(catTotal / 100).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Individual items */}
          <div className="space-y-2">
            {expenseList?.map((exp) => {
              const c = EXPENSE_CATEGORY_COLORS[exp.category as ExpenseCategory];
              return (
                <div key={exp.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
                  <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0", c.bg)}>
                    {EXPENSE_CATEGORY_ICONS[exp.category as ExpenseCategory]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "oklch(0.88 0.03 70)" }}>
                      {exp.description || EXPENSE_CATEGORY_LABELS[exp.category as ExpenseCategory]}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>{format(new Date(exp.date), "MMM d, yyyy")}</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }}>
                    {isCanada ? "C" : ""}${(exp.amountCents / 100).toFixed(2)}
                  </span>
                  <button onClick={() => deleteMutation.mutate({ id: exp.id })} className="p-1">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.20 25)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AddExpenseDialog rodeoId={rodeoId} open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

// ─── Performance Run Card ─────────────────────────────────────────────────────
function AddPerformanceDialog({ rodeoId, discipline, open, onClose }: {
  rodeoId: number; discipline: Discipline; open: boolean; onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const createMutation = trpc.performances.create.useMutation({
    onSuccess: () => { utils.performances.listByRodeo.invalidate({ rodeoId }); toast.success("Run logged!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const isTimed = isTimedDiscipline(discipline);
  const [form, setForm] = useState({ value: "", penalty: "0", notes: "", runDate: new Date().toISOString().split("T")[0] });

  const handleSubmit = () => {
    const val = parseFloat(form.value);
    if (isNaN(val)) { toast.error("Enter a valid value"); return; }
    createMutation.mutate({
      rodeoId, discipline,
      timeSeconds: isTimed ? val : undefined,
      score: !isTimed ? val : undefined,
      penaltySeconds: parseFloat(form.penalty) || 0,
      notes: form.notes || undefined,
      runDate: new Date(form.runDate).getTime(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
            {DISCIPLINE_ICONS[discipline]} Log Run — {DISCIPLINE_LABELS[discipline]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              {isTimed ? "Time in Seconds *" : "Score (points) *"}
            </Label>
            <Input className="mt-1" type="number" step="0.001" placeholder={isTimed ? "e.g. 17.234" : "e.g. 85.5"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            {isTimed && <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.04 55)" }}>Enter your raw time in seconds (e.g. 13.456)</p>}
          </div>
          {isTimed && (
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Penalty Seconds</Label>
              <Input className="mt-1" type="number" step="0.5" min="0" value={form.penalty} onChange={(e) => setForm({ ...form, penalty: e.target.value })} />
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Run Date</Label>
            <Input className="mt-1" type="date" value={form.runDate} onChange={(e) => setForm({ ...form, runDate: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
            <Input className="mt-1" placeholder="Any notes about this run…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending} className="btn-gold">
            {createMutation.isPending ? "Saving…" : "★ Log Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PerformancesList({ rodeoId, disciplines }: { rodeoId: number; disciplines: Discipline[] }) {
  const utils = trpc.useUtils();
  const { data: runs, isLoading } = trpc.performances.listByRodeo.useQuery({ rodeoId });
  const deleteMutation = trpc.performances.delete.useMutation({
    onSuccess: () => utils.performances.listByRodeo.invalidate({ rodeoId }),
    onError: (e) => toast.error(e.message),
  });
  const [addFor, setAddFor] = useState<Discipline | null>(null);

  // Group runs by discipline
  const runsByDiscipline: Record<string, typeof runs> = {};
  disciplines.forEach((d) => { runsByDiscipline[d] = []; });
  runs?.forEach((r) => {
    if (!runsByDiscipline[r.discipline]) runsByDiscipline[r.discipline] = [];
    runsByDiscipline[r.discipline]!.push(r);
  });

  return (
    <div className="space-y-4">
      {disciplines.map((discipline) => {
        const disciplineRuns = runsByDiscipline[discipline] ?? [];
        const isTimed = isTimedDiscipline(discipline);
        const colors = DISCIPLINE_COLORS[discipline];
        const allTimes = disciplineRuns.filter(r => r.timeSeconds != null).map(r => (r.timeSeconds ?? 0) + (r.penaltySeconds ?? 0));
        const bestTime = allTimes.length ? Math.min(...allTimes) : null;

        return (
          <div key={discipline} className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.28 0.06 50)" }}>
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${colors.accent}, transparent)` }} />
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0", colors.bg)}>
                    {DISCIPLINE_ICONS[discipline]}
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>{DISCIPLINE_LABELS[discipline]}</p>
                    {isTimed && bestTime != null && (
                      <p className="text-xs" style={{ color: "oklch(0.72 0.16 75)" }}>Best: {formatTime(bestTime)}</p>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => setAddFor(discipline)} className="btn-gold h-7 text-xs gap-1 px-2.5 rounded-full">
                  <Plus className="w-3 h-3" /> Log
                </Button>
              </div>

              {isLoading ? (
                <div className="h-10 rounded animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />
              ) : disciplineRuns.length === 0 ? (
                <div className="text-center py-3 rounded-lg" style={{ background: "oklch(0.18 0.04 48)" }}>
                  <p className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>No runs logged yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {disciplineRuns.map((run, idx) => {
                    const total = isTimed ? (run.timeSeconds ?? 0) + (run.penaltySeconds ?? 0) : null;
                    const isBest = total != null && allTimes.length > 0 && total === Math.min(...allTimes);
                    return (
                      <div key={run.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: "oklch(0.20 0.05 48)" }}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", isBest ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground")}
                          style={isBest ? {} : { background: "oklch(0.25 0.05 50)", color: "oklch(0.52 0.05 60)" }}>
                          {isBest ? "★" : `#${idx + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold" style={{ color: "oklch(0.88 0.03 70)" }}>
                            {isTimed ? formatTime(total) : formatScore(run.score)}
                          </span>
                          {isTimed && (run.penaltySeconds ?? 0) > 0 && (
                            <span className="text-xs ml-1" style={{ color: "oklch(0.65 0.18 25)" }}>(+{run.penaltySeconds}s)</span>
                          )}
                          <p className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>{format(new Date(run.runDate), "MMM d, yyyy")}</p>
                        </div>
                        <button onClick={() => deleteMutation.mutate({ id: run.id })} className="p-1">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.20 25)" }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {addFor && (
        <AddPerformanceDialog
          rodeoId={rodeoId}
          discipline={addFor}
          open={true}
          onClose={() => setAddFor(null)}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RodeoDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const rodeoId = parseInt(params.id ?? "0", 10);
  const utils = trpc.useUtils();

  const { data: rodeo, isLoading } = trpc.rodeos.get.useQuery({ id: rodeoId });
  const toggleEntered = trpc.rodeos.update.useMutation({
    onSuccess: () => utils.rodeos.get.invalidate({ id: rodeoId }),
  });
  const deleteRodeo = trpc.rodeos.delete.useMutation({
    onSuccess: () => { toast.success("Rodeo deleted"); navigate("/schedule"); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-header px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/schedule")} style={{ color: "oklch(0.72 0.16 75)" }}><ArrowLeft className="w-5 h-5" /></button>
          <div className="h-5 w-40 rounded animate-pulse" style={{ background: "oklch(0.25 0.05 50)" }} />
        </div>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />)}
        </div>
      </div>
    );
  }

  if (!rodeo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p style={{ color: "oklch(0.52 0.05 60)" }}>Rodeo not found</p>
        <Button variant="link" onClick={() => navigate("/schedule")}>Back to Schedule</Button>
      </div>
    );
  }

  const now = new Date();
  const deadlineDays = differenceInDays(new Date(rodeo.entryDeadline), now);
  const rodeoDays = differenceInDays(new Date(rodeo.rodeoDate), now);
  const isCanada = (rodeo as any).countryCode === "CA";

  // Parse multi-discipline list
  let disciplineList: Discipline[] = [];
  try { disciplineList = (rodeo as any).disciplines ? JSON.parse((rodeo as any).disciplines) : [rodeo.discipline]; }
  catch { disciplineList = [rodeo.discipline as Discipline]; }

  const mapsUrl = rodeo.locationAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(rodeo.locationAddress)}`
    : null;

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <div className="page-header sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/schedule")} style={{ color: "oklch(0.72 0.16 75)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
              {rodeo.name}
            </h1>
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
              {RODEO_TYPE_LABELS[rodeo.rodeotype as RodeoType]}
              {isCanada ? " · 🍁 Canada" : " · 🇺🇸 USA"}
            </p>
          </div>
          <button onClick={() => { if (confirm("Delete this rodeo?")) deleteRodeo.mutate({ id: rodeoId }); }} style={{ color: "oklch(0.52 0.05 60)" }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Info card */}
        <div className="card-western rounded-xl overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, oklch(0.72 0.16 75), oklch(0.55 0.20 25))" }} />
          <div className="p-4 space-y-3">
            {/* Disciplines */}
            <div className="flex flex-wrap gap-2">
              {disciplineList.map((d) => {
                const c = DISCIPLINE_COLORS[d];
                return (
                  <span key={d} className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold", c.bg, c.text)}>
                    {DISCIPLINE_ICONS[d]} {DISCIPLINE_LABELS[d]}
                  </span>
                );
              })}
              <button
                onClick={() => toggleEntered.mutate({ id: rodeoId, isEntered: !rodeo.isEntered })}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ml-auto",
                  rodeo.isEntered ? "bg-green-900/40 text-green-400" : "bg-muted text-muted-foreground hover:bg-muted/80")}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {rodeo.isEntered ? "Entered ✓" : "Mark Entered"}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.78 0.10 65)" }}>
                <CalendarDays className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.52 0.05 60)" }} />
                <span>{format(new Date(rodeo.rodeoDate), "EEEE, MMMM d, yyyy")}</span>
                {rodeoDays >= 0 && <span className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>({rodeoDays === 0 ? "Today!" : `${rodeoDays}d away`})</span>}
              </div>

              <div className={cn("flex items-center gap-2 text-sm", deadlineDays < 0 ? "text-muted-foreground" : deadlineDays <= 3 ? "text-orange-400 font-medium" : "")}
                style={deadlineDays > 3 ? { color: "oklch(0.78 0.10 65)" } : {}}>
                <Bell className="w-4 h-4 flex-shrink-0" />
                <span>Entry deadline: {format(new Date(rodeo.entryDeadline), "MMMM d, yyyy")}</span>
                {deadlineDays >= 0 && <span className="text-xs">({deadlineDays === 0 ? "Today!" : `${deadlineDays}d left`})</span>}
              </div>

              {rodeo.locationName && (
                <div className="flex items-start gap-2 text-sm" style={{ color: "oklch(0.78 0.10 65)" }}>
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }} />
                  <div>
                    <p>{rodeo.locationName}</p>
                    {rodeo.locationAddress && <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>{rodeo.locationAddress}</p>}
                  </div>
                </div>
              )}

              {(rodeo as any).parkingNotes && (
                <div className="flex items-start gap-2 text-sm p-2 rounded-lg" style={{ background: "oklch(0.20 0.05 48)", color: "oklch(0.62 0.05 65)" }}>
                  <span className="text-base">🚛</span>
                  <p className="text-xs">{(rodeo as any).parkingNotes}</p>
                </div>
              )}

              {rodeo.notes && (
                <p className="text-sm rounded-lg px-3 py-2" style={{ background: "oklch(0.20 0.05 48)", color: "oklch(0.62 0.05 65)" }}>{rodeo.notes}</p>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="space-y-2">
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 transition-colors"
                  style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.72 0.16 75)" }}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> Get Directions
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => navigate(`/locations?address=${encodeURIComponent(rodeo.locationAddress ?? rodeo.locationName ?? "")}&name=${encodeURIComponent(rodeo.name)}`)}
                className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 transition-colors"
                style={{ background: "oklch(0.65 0.14 145 / 15%)", color: "oklch(0.65 0.14 145)" }}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Fuel className="w-4 h-4" /> Trip Planner + Fuel Stations
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Trip budget calculator */}
        <TripBudgetCalc distanceKm={(rodeo as any).distanceKm} countryCode={(rodeo as any).countryCode} />

        {/* Tabs: Runs / Expenses */}
        <Tabs defaultValue="runs">
          <TabsList className="w-full">
            <TabsTrigger value="runs" className="flex-1">Runs</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="runs" className="mt-4">
            <PerformancesList rodeoId={rodeoId} disciplines={disciplineList} />
          </TabsContent>
          <TabsContent value="expenses" className="mt-4">
            <ExpensesList rodeoId={rodeoId} countryCode={(rodeo as any).countryCode} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
