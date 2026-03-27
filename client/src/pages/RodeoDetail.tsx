import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, CalendarDays, Bell, CheckCircle2, Plus, Trash2,
  Clock, Star, DollarSign, Video, ChevronRight, Edit2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_COLORS,
  RODEO_TYPE_LABELS, isTimedDiscipline, formatTime, formatScore,
  type Discipline, type RodeoType,
} from "@/lib/disciplines";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from "@/lib/expenses";
import type { ExpenseCategory } from "@/lib/expenses";
import { cn } from "@/lib/utils";

// ─── Expense helpers ─────────────────────────────────────────────────────────

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
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {EXPENSE_CATEGORY_ICONS[c]} {EXPENSE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input className="mt-1" placeholder="e.g. Entry fee for barrel racing" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Amount ($) *</Label>
            <Input className="mt-1" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Input className="mt-1" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpensesList({ rodeoId }: { rodeoId: number }) {
  const utils = trpc.useUtils();
  const { data: expenseList, isLoading } = trpc.expenses.listByRodeo.useQuery({ rodeoId });
  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => utils.expenses.listByRodeo.invalidate({ rodeoId }),
    onError: (e) => toast.error(e.message),
  });
  const [showAdd, setShowAdd] = useState(false);

  const total = expenseList?.reduce((s, e) => s + e.amountCents, 0) ?? 0;

  // Group by category
  const byCategory: Record<string, typeof expenseList> = {};
  expenseList?.forEach((e) => {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category]!.push(e);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-foreground">${(total / 100).toFixed(2)}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : expenseList?.length === 0 ? (
        <div className="text-center py-10">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No expenses logged yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>Add First Expense</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Category breakdown */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Breakdown</p>
            <div className="space-y-1.5">
              {Object.entries(byCategory).map(([cat, items]) => {
                const catTotal = items!.reduce((s, e) => s + e.amountCents, 0);
                const pct = total > 0 ? (catTotal / total) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-sm w-5">{EXPENSE_CATEGORY_ICONS[cat as ExpenseCategory]}</span>
                    <span className="text-xs text-foreground flex-1">{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-16 text-right">${(catTotal / 100).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual items */}
          <div className="space-y-2">
            {expenseList?.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
                <span className="text-lg">{EXPENSE_CATEGORY_ICONS[exp.category as ExpenseCategory]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {exp.description || EXPENSE_CATEGORY_LABELS[exp.category as ExpenseCategory]}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(exp.date), "MMM d, yyyy")}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">${(exp.amountCents / 100).toFixed(2)}</span>
                <button
                  onClick={() => deleteMutation.mutate({ id: exp.id })}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
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
      rodeoId,
      discipline,
      timeSeconds: isTimed ? val : undefined,
      score: !isTimed ? val : undefined,
      penaltySeconds: parseFloat(form.penalty) || 0,
      notes: form.notes || undefined,
      runDate: new Date(form.runDate).getTime(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader><DialogTitle>Log Run — {DISCIPLINE_LABELS[discipline]}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs">{isTimed ? "Time (seconds) *" : "Score (points) *"}</Label>
            <Input className="mt-1" type="number" step="0.01" placeholder={isTimed ? "e.g. 17.23" : "e.g. 85.5"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          {isTimed && (
            <div>
              <Label className="text-xs">Penalty Seconds</Label>
              <Input className="mt-1" type="number" step="0.5" min="0" value={form.penalty} onChange={(e) => setForm({ ...form, penalty: e.target.value })} />
            </div>
          )}
          <div>
            <Label className="text-xs">Run Date</Label>
            <Input className="mt-1" type="date" value={form.runDate} onChange={(e) => setForm({ ...form, runDate: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Input className="mt-1" placeholder="Any notes about this run…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving…" : "Log Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PerformancesList({ rodeoId, discipline }: { rodeoId: number; discipline: Discipline }) {
  const utils = trpc.useUtils();
  const { data: runs, isLoading } = trpc.performances.listByRodeo.useQuery({ rodeoId });
  const deleteMutation = trpc.performances.delete.useMutation({
    onSuccess: () => utils.performances.listByRodeo.invalidate({ rodeoId }),
    onError: (e) => toast.error(e.message),
  });
  const [showAdd, setShowAdd] = useState(false);
  const isTimed = isTimedDiscipline(discipline);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{runs?.length ?? 0} run{runs?.length !== 1 ? "s" : ""} logged</p>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Log Run
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : runs?.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No runs logged yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>Log First Run</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {runs?.map((run, idx) => {
            const total = isTimed ? (run.timeSeconds ?? 0) + (run.penaltySeconds ?? 0) : null;
            const allTimes = runs.filter(r => r.timeSeconds != null).map(r => (r.timeSeconds ?? 0) + (r.penaltySeconds ?? 0));
            const isBest = total != null && allTimes.length > 0 && total === Math.min(...allTimes);
            return (
              <div key={run.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", isBest ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground")}>
                  {isBest ? "★" : `#${idx + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {isTimed ? formatTime(total) : formatScore(run.score)}
                    {isTimed && (run.penaltySeconds ?? 0) > 0 && (
                      <span className="text-xs text-orange-600 ml-1">(+{run.penaltySeconds}s penalty)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(run.runDate), "MMM d, yyyy")}</p>
                  {run.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{run.notes}</p>}
                </div>
                <button onClick={() => deleteMutation.mutate({ id: run.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddPerformanceDialog rodeoId={rodeoId} discipline={discipline} open={showAdd} onClose={() => setShowAdd(false)} />
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
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!rodeo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Rodeo not found</p>
        <Button variant="link" onClick={() => navigate("/schedule")}>Back to Schedule</Button>
      </div>
    );
  }

  const now = new Date();
  const deadlineDays = differenceInDays(new Date(rodeo.entryDeadline), now);
  const rodeoDays = differenceInDays(new Date(rodeo.rodeoDate), now);
  const colors = DISCIPLINE_COLORS[rodeo.discipline as Discipline];

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
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>{RODEO_TYPE_LABELS[rodeo.rodeotype as RodeoType]}</p>
          </div>
          <button
            onClick={() => { if (confirm("Delete this rodeo?")) deleteRodeo.mutate({ id: rodeoId }); }}
            style={{ color: "oklch(0.52 0.05 60)" }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Info card */}
        <div className="card-western rounded-xl overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, oklch(0.72 0.16 75), oklch(0.55 0.20 25))" }} />
          <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold", colors.bg, colors.text)}>
              {DISCIPLINE_ICONS[rodeo.discipline as Discipline]} {DISCIPLINE_LABELS[rodeo.discipline as Discipline]}
            </span>
            <button
              onClick={() => toggleEntered.mutate({ id: rodeoId, isEntered: !rodeo.isEntered })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                rodeo.isEntered
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {rodeo.isEntered ? "Entered" : "Mark Entered"}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{format(new Date(rodeo.rodeoDate), "EEEE, MMMM d, yyyy")}</span>
              {rodeoDays >= 0 && <span className="text-xs text-muted-foreground">({rodeoDays === 0 ? "Today!" : `${rodeoDays}d away`})</span>}
            </div>

            <div className={cn("flex items-center gap-2 text-sm", deadlineDays < 0 ? "text-muted-foreground" : deadlineDays <= 3 ? "text-orange-600 font-medium" : "text-foreground")}>
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span>Entry deadline: {format(new Date(rodeo.entryDeadline), "MMMM d, yyyy")}</span>
              {deadlineDays >= 0 && <span className="text-xs">({deadlineDays === 0 ? "Today!" : `${deadlineDays}d left`})</span>}
            </div>

            {rodeo.locationName && (
              <div className="flex items-start gap-2 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p>{rodeo.locationName}</p>
                  {rodeo.locationAddress && <p className="text-xs text-muted-foreground">{rodeo.locationAddress}</p>}
                </div>
              </div>
            )}

            {rodeo.notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{rodeo.notes}</p>
            )}
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-3 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                Get Directions
              </div>
              <ChevronRight className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => navigate(`/locations?rodeoId=${rodeoId}&address=${encodeURIComponent(rodeo.locationAddress ?? rodeo.locationName ?? "")}&name=${encodeURIComponent(rodeo.name)}`)}
            className="flex items-center justify-between w-full bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg px-3 py-2.5 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              View on Map + Fuel Stations
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          </div>
        </div>

        {/* Tabs: Runs / Expenses */}
        <Tabs defaultValue="runs">
          <TabsList className="w-full">
            <TabsTrigger value="runs" className="flex-1">Runs</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="runs" className="mt-4">
            <PerformancesList rodeoId={rodeoId} discipline={rodeo.discipline as Discipline} />
          </TabsContent>
          <TabsContent value="expenses" className="mt-4">
            <ExpensesList rodeoId={rodeoId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
