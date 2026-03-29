import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, Trash2, Edit2, ChevronRight, ChevronDown, Loader2,
  Stethoscope, Bell, Wheat, Receipt, CalendarPlus, CheckCircle2,
  Circle, Upload, FileText, X,
} from "lucide-react";
import {
  DISCIPLINES, DISCIPLINE_LABELS, DISCIPLINE_IMAGES, DISCIPLINE_COLORS, type Discipline,
} from "@/lib/disciplines";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { downloadICS, openGoogleCalendar, isIOS, isAndroid } from "@/lib/calendarUtils";

// ─── Constants ────────────────────────────────────────────────────────────────
const CARE_TYPES = ["vet", "dentist", "farrier", "deworming", "vaccination", "other"] as const;
type CareType = typeof CARE_TYPES[number];
const CARE_LABELS: Record<CareType, string> = {
  vet: "Vet Visit", dentist: "Dentist / Teeth Float", farrier: "Farrier / Shoeing",
  deworming: "Deworming", vaccination: "Vaccination", other: "Other",
};
const CARE_ICONS: Record<CareType, string> = {
  vet: "🩺", dentist: "🦷", farrier: "🔨", deworming: "💊", vaccination: "💉", other: "📋",
};
const FEED_TYPES = ["hay", "grain", "supplement", "mineral", "other"] as const;
const FEED_LABELS: Record<typeof FEED_TYPES[number], string> = {
  hay: "Hay", grain: "Grain", supplement: "Supplement", mineral: "Mineral", other: "Other",
};

function formatDollars(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

// ─── Calendar Picker Dialog ───────────────────────────────────────────────────
function CalendarPickerDialog({ open, onClose, event }: {
  open: boolean; onClose: () => void;
  event: { title: string; date: Date; description?: string };
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold" style={{ color: "oklch(0.88 0.12 75)", fontFamily: "'Playfair Display', serif" }}>
            Add to Calendar
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs mb-3" style={{ color: "oklch(0.62 0.05 65)" }}>
          {event.title} — {format(event.date, "MMM d, yyyy")}
        </p>
        <div className="space-y-2">
          {(isIOS() || !isAndroid()) && (
            <Button variant="outline" className="w-full text-sm justify-start gap-2" onClick={() => { downloadICS({ title: event.title, startDate: event.date, description: event.description }); onClose(); }}>
              Apple Calendar (.ics)
            </Button>
          )}
          {isAndroid() && (
            <Button variant="outline" className="w-full text-sm justify-start gap-2" onClick={() => { downloadICS({ title: event.title, startDate: event.date, description: event.description }); onClose(); }}>
              Android Calendar (.ics)
            </Button>
          )}
          <Button variant="outline" className="w-full text-sm justify-start gap-2" onClick={() => { openGoogleCalendar({ title: event.title, startDate: event.date, description: event.description }); onClose(); }}>
            Google Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Health Log Tab ───────────────────────────────────────────────────────────
function HealthLogTab({ horseId, horseName }: { horseId: number; horseName: string }) {
  const utils = trpc.useUtils();
  const { data: logs = [], isLoading } = trpc.horseHealthLogs.list.useQuery({ horseId });
  const createLog = trpc.horseHealthLogs.create.useMutation({
    onSuccess: () => { utils.horseHealthLogs.list.invalidate({ horseId }); toast.success("Log entry added"); setShowAdd(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteLog = trpc.horseHealthLogs.delete.useMutation({
    onSuccess: () => utils.horseHealthLogs.list.invalidate({ horseId }),
    onError: (e) => toast.error(e.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<CareType>("vet");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  function resetForm() { setType("vet"); setTitle(""); setProvider(""); setCost(""); setNotes(""); setLogDate(new Date().toISOString().slice(0, 10)); }

  const sorted = [...logs].sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Health History</p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ background: "oklch(0.16 0.04 48)", border: "1px solid oklch(0.24 0.05 50)" }}>
          <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.72 0.16 75)" }} />
          <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>No health entries yet</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.38 0.04 55)" }}>Track vet visits, dental work, farrier appointments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "oklch(0.17 0.04 48)", border: "1px solid oklch(0.26 0.05 50)" }}>
              <span className="text-lg flex-shrink-0 mt-0.5">{CARE_ICONS[log.type as CareType]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>{log.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.72 0.16 75)" }}>
                    {CARE_LABELS[log.type as CareType]}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>
                  {format(new Date(log.logDate), "MMM d, yyyy")}
                  {log.provider ? ` · ${log.provider}` : ""}
                  {log.cost && log.cost > 0 ? ` · ${formatDollars(log.cost)}` : ""}
                </p>
                {log.notes && <p className="text-xs mt-1 leading-relaxed" style={{ color: "oklch(0.62 0.05 65)" }}>{log.notes}</p>}
              </div>
              <button onClick={() => deleteLog.mutate({ id: log.id })} className="flex-shrink-0 p-1 rounded opacity-50 hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 25)" }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="max-w-sm" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ color: "oklch(0.88 0.12 75)", fontFamily: "'Playfair Display', serif" }}>
              Add Health Log — {horseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CareType)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CARE_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{CARE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Title / Description</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual check-up, Teeth float" className="mt-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Provider</Label>
                <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Vet / Farrier name" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Cost ($)</Label>
                <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className="mt-1 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Date</Label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Treatment details, observations, medications..." rows={3} className="mt-1 text-sm resize-none" />
            </div>
            <Button className="w-full" disabled={!title || createLog.isPending} onClick={() => createLog.mutate({ horseId, type, title, provider: provider || undefined, cost: cost ? parseFloat(cost) : undefined, notes: notes || undefined, logDate })}>
              {createLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Care Reminders Tab ───────────────────────────────────────────────────────
function CareRemindersTab({ horseId, horseName }: { horseId: number; horseName: string }) {
  const utils = trpc.useUtils();
  const { data: reminders = [], isLoading } = trpc.horseCareReminders.list.useQuery({ horseId });
  const createReminder = trpc.horseCareReminders.create.useMutation({
    onSuccess: () => { utils.horseCareReminders.list.invalidate({ horseId }); toast.success("Reminder added"); setShowAdd(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleDone = trpc.horseCareReminders.update.useMutation({
    onSuccess: () => utils.horseCareReminders.list.invalidate({ horseId }),
  });
  const deleteReminder = trpc.horseCareReminders.delete.useMutation({
    onSuccess: () => utils.horseCareReminders.list.invalidate({ horseId }),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [calEvent, setCalEvent] = useState<{ title: string; date: Date; description?: string } | null>(null);
  const [type, setType] = useState<CareType>("vet");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderDate, setReminderDate] = useState(() => new Date().toISOString().slice(0, 10));
  function resetForm() { setType("vet"); setTitle(""); setNotes(""); setReminderDate(new Date().toISOString().slice(0, 10)); }

  const upcoming = reminders.filter((r) => !r.isCompleted).sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  const done = reminders.filter((r) => r.isCompleted).sort((a, b) => new Date(b.reminderDate).getTime() - new Date(a.reminderDate).getTime());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Upcoming Care</p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Reminder
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>
      ) : upcoming.length === 0 && done.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ background: "oklch(0.16 0.04 48)", border: "1px solid oklch(0.24 0.05 50)" }}>
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.72 0.16 75)" }} />
          <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>No reminders set</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.38 0.04 55)" }}>Set reminders for vet, farrier, dentist appointments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((r) => {
            const isPast = new Date(r.reminderDate) < new Date();
            return (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: isPast ? "oklch(0.18 0.06 25 / 60%)" : "oklch(0.17 0.04 48)", border: `1px solid ${isPast ? "oklch(0.65 0.18 25 / 40%)" : "oklch(0.26 0.05 50)"}` }}>
                <button onClick={() => toggleDone.mutate({ id: r.id, isCompleted: true })} className="flex-shrink-0 mt-0.5">
                  <Circle className="w-4 h-4" style={{ color: isPast ? "oklch(0.65 0.18 25)" : "oklch(0.72 0.16 75)" }} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: isPast ? "oklch(0.65 0.18 25)" : "oklch(0.52 0.05 60)" }}>
                    {CARE_LABELS[r.type as CareType]} · {format(new Date(r.reminderDate), "MMM d, yyyy")}
                    {isPast ? " · Overdue" : ""}
                  </p>
                  {r.notes && <p className="text-xs mt-1" style={{ color: "oklch(0.62 0.05 65)" }}>{r.notes}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setCalEvent({ title: `${horseName}: ${r.title}`, date: new Date(r.reminderDate), description: r.notes ?? undefined })} className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity" title="Add to calendar">
                    <CalendarPlus className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.16 75)" }} />
                  </button>
                  <button onClick={() => deleteReminder.mutate({ id: r.id })} className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 25)" }} />
                  </button>
                </div>
              </div>
            );
          })}
          {done.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: "oklch(0.38 0.04 55)" }}>Completed</p>
              {done.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl opacity-60" style={{ background: "oklch(0.15 0.03 48)", border: "1px solid oklch(0.22 0.04 50)" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.18 145)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-through" style={{ color: "oklch(0.62 0.03 65)" }}>{r.title}</p>
                    <p className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>{format(new Date(r.reminderDate), "MMM d, yyyy")}</p>
                  </div>
                  <button onClick={() => deleteReminder.mutate({ id: r.id })} className="p-1 rounded opacity-50 hover:opacity-100">
                    <Trash2 className="w-3 h-3" style={{ color: "oklch(0.65 0.18 25)" }} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="max-w-sm" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ color: "oklch(0.88 0.12 75)", fontFamily: "'Playfair Display', serif" }}>
              Add Reminder — {horseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CareType)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CARE_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{CARE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spring vet check, Farrier appointment" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Date</Label>
              <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details..." rows={2} className="mt-1 text-sm resize-none" />
            </div>
            <Button className="w-full" disabled={!title || createReminder.isPending} onClick={() => createReminder.mutate({ horseId, type, title, notes: notes || undefined, reminderDate })}>
              {createReminder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Reminder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {calEvent && <CalendarPickerDialog open={!!calEvent} onClose={() => setCalEvent(null)} event={calEvent} />}
    </div>
  );
}

// ─── Feeding Tab ──────────────────────────────────────────────────────────────
function FeedingTab({ horseId, horseName }: { horseId: number; horseName: string }) {
  const utils = trpc.useUtils();
  const { data: feeds = [], isLoading } = trpc.horseFeeding.list.useQuery({ horseId });
  const createFeed = trpc.horseFeeding.create.useMutation({
    onSuccess: () => { utils.horseFeeding.list.invalidate({ horseId }); toast.success("Feed entry added"); setShowAdd(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleActive = trpc.horseFeeding.update.useMutation({
    onSuccess: () => utils.horseFeeding.list.invalidate({ horseId }),
  });
  const deleteFeed = trpc.horseFeeding.delete.useMutation({
    onSuccess: () => utils.horseFeeding.list.invalidate({ horseId }),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [feedName, setFeedName] = useState("");
  const [feedType, setFeedType] = useState<typeof FEED_TYPES[number]>("hay");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [notes, setNotes] = useState("");
  function resetForm() { setFeedName(""); setFeedType("hay"); setAmount(""); setFrequency(""); setMonthlyCost(""); setNotes(""); }

  const active = feeds.filter((f) => f.isActive);
  const inactive = feeds.filter((f) => !f.isActive);
  const totalMonthly = active.reduce((s, f) => s + (f.monthlyCostCents ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Feeding & Supplements</p>
          {totalMonthly > 0 && <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.18 145)" }}>Est. {formatDollars(totalMonthly)}/month</p>}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>
      ) : active.length === 0 && inactive.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ background: "oklch(0.16 0.04 48)", border: "1px solid oklch(0.24 0.05 50)" }}>
          <Wheat className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.72 0.16 75)" }} />
          <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>No feeding plan yet</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.38 0.04 55)" }}>Track hay, grain, supplements, minerals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((f) => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "oklch(0.17 0.04 48)", border: "1px solid oklch(0.26 0.05 50)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>{f.feedName}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.72 0.16 75)" }}>
                    {FEED_LABELS[f.feedType as typeof FEED_TYPES[number]]}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>
                  {[f.amount, f.frequency].filter(Boolean).join(" · ")}
                  {f.monthlyCostCents && f.monthlyCostCents > 0 ? ` · ${formatDollars(f.monthlyCostCents)}/mo` : ""}
                </p>
                {f.notes && <p className="text-xs mt-1" style={{ color: "oklch(0.62 0.05 65)" }}>{f.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive.mutate({ id: f.id, isActive: false })} className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity" title="Mark inactive">
                  <X className="w-3.5 h-3.5" style={{ color: "oklch(0.52 0.05 60)" }} />
                </button>
                <button onClick={() => deleteFeed.mutate({ id: f.id })} className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 25)" }} />
                </button>
              </div>
            </div>
          ))}
          {inactive.length > 0 && <p className="text-xs pt-1 opacity-50" style={{ color: "oklch(0.42 0.04 55)" }}>{inactive.length} inactive item{inactive.length !== 1 ? "s" : ""} hidden</p>}
        </div>
      )}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="max-w-sm" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ color: "oklch(0.88 0.12 75)", fontFamily: "'Playfair Display', serif" }}>
              Add Feed — {horseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Feed / Supplement Name</Label>
              <Input value={feedName} onChange={(e) => setFeedName(e.target.value)} placeholder="e.g. Timothy Hay, Oats, Vitamin E" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Type</Label>
              <Select value={feedType} onValueChange={(v) => setFeedType(v as typeof FEED_TYPES[number])}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{FEED_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{FEED_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Amount</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 2 flakes" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Frequency</Label>
                <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Twice daily" className="mt-1 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Est. Monthly Cost ($)</Label>
              <Input type="number" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} placeholder="0.00" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Storage instructions, brand preferences..." rows={2} className="mt-1 text-sm resize-none" />
            </div>
            <Button className="w-full" disabled={!feedName || createFeed.isPending} onClick={() => createFeed.mutate({ horseId, feedName, feedType, amount: amount || undefined, frequency: frequency || undefined, notes: notes || undefined, monthlyCostDollars: monthlyCost ? parseFloat(monthlyCost) : undefined })}>
              {createFeed.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Feed"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Receipts Tab ─────────────────────────────────────────────────────────────
function ReceiptsTab({ horseId, horseName }: { horseId: number; horseName: string }) {
  const utils = trpc.useUtils();
  const { data: receipts = [], isLoading } = trpc.horseReceipts.list.useQuery({ horseId });
  const createReceipt = trpc.horseReceipts.create.useMutation({
    onSuccess: () => { utils.horseReceipts.list.invalidate({ horseId }); toast.success("Receipt saved"); setShowAdd(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteReceipt = trpc.horseReceipts.delete.useMutation({
    onSuccess: () => utils.horseReceipts.list.invalidate({ horseId }),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CareType>("vet");
  const [amount, setAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ key: string; url: string; filename: string; mimeType: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  function resetForm() { setTitle(""); setCategory("vet"); setAmount(""); setReceiptDate(new Date().toISOString().slice(0, 10)); setNotes(""); setUploadedFile(null); }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", file);
      formData.append("horseId", String(horseId));
      const res = await fetch("/api/upload/receipt", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUploadedFile({ key: data.key, url: data.url, filename: file.name, mimeType: file.type });
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed — try again");
    } finally {
      setUploading(false);
    }
  }

  const totalSpent = receipts.reduce((s, r) => s + r.amountCents, 0);
  const sorted = [...receipts].sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Receipts & Expenses</p>
          {totalSpent > 0 && <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.18 145)" }}>Total: {formatDollars(totalSpent)}</p>}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Receipt
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ background: "oklch(0.16 0.04 48)", border: "1px solid oklch(0.24 0.05 50)" }}>
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "oklch(0.72 0.16 75)" }} />
          <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>No receipts yet</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.38 0.04 55)" }}>Upload vet bills, farrier invoices, feed receipts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "oklch(0.17 0.04 48)", border: "1px solid oklch(0.26 0.05 50)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.22 0.06 52)" }}>
                {r.url && r.mimeType?.startsWith("image/") ? (
                  <img src={r.url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <FileText className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: "oklch(0.88 0.03 70)" }}>{r.title}</p>
                  <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.18 145)" }}>{formatDollars(r.amountCents)}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>
                  {CARE_LABELS[r.category as CareType]} · {format(new Date(r.receiptDate), "MMM d, yyyy")}
                </p>
                {r.notes && <p className="text-xs mt-1" style={{ color: "oklch(0.62 0.05 65)" }}>{r.notes}</p>}
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 inline-block" style={{ color: "oklch(0.72 0.16 75)" }}>View file</a>}
              </div>
              <button onClick={() => deleteReceipt.mutate({ id: r.id })} className="flex-shrink-0 p-1 rounded opacity-50 hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.18 25)" }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="max-w-sm" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold" style={{ color: "oklch(0.88 0.12 75)", fontFamily: "'Playfair Display', serif" }}>
              Add Receipt — {horseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Description</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual vet bill, Farrier invoice" className="mt-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CareType)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CARE_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{CARE_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Amount ($)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Date</Label>
              <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Attach Receipt (optional)</Label>
              <div className="mt-1">
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.20 0.06 52)", border: "1px solid oklch(0.65 0.18 145 / 40%)" }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.18 145)" }} />
                    <span className="text-xs flex-1 truncate" style={{ color: "oklch(0.88 0.03 70)" }}>{uploadedFile.filename}</span>
                    <button onClick={() => setUploadedFile(null)}><X className="w-3.5 h-3.5" style={{ color: "oklch(0.52 0.05 60)" }} /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-dashed border-2 text-xs transition-colors" style={{ borderColor: "oklch(0.35 0.06 55)", color: "oklch(0.52 0.05 60)" }}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading..." : "Tap to upload photo or PDF"}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." rows={2} className="mt-1 text-sm resize-none" />
            </div>
            <Button className="w-full" disabled={!title || !amount || createReceipt.isPending} onClick={() => createReceipt.mutate({ horseId, title, category, amountDollars: parseFloat(amount), receiptDate, notes: notes || undefined, s3Key: uploadedFile?.key, url: uploadedFile?.url, filename: uploadedFile?.filename, mimeType: uploadedFile?.mimeType })}>
              {createReceipt.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Receipt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Horse Card (expandable) ──────────────────────────────────────────────────
function HorseCard({ horse, onEdit, onDelete }: {
  horse: { id: number; name: string; disciplines: string | null; breed: string | null; color: string | null; age: number | null; notes: string | null };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const disciplines: Discipline[] = horse.disciplines ? JSON.parse(horse.disciplines) : [];

  return (
    <div className="rounded-xl overflow-hidden shimmer-card" style={{ border: "1px solid oklch(0.30 0.08 55)" }}>
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, oklch(0.72 0.18 75), oklch(0.65 0.20 50), oklch(0.72 0.18 75))" }} />

      {/* Header row */}
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(0.25 0.08 55)", border: "2px solid oklch(0.72 0.18 75)" }}>
          <svg viewBox="0 0 64 64" fill="oklch(0.72 0.18 75)" className="w-7 h-7">
            <path d="M52 8c-2 0-3.5 1-4.5 2.5L45 14l-3-1.5c-.8-.4-1.7-.4-2.5 0L37 14l-2-3C34 9.2 32.2 8 30 8c-3 0-5.5 1.8-6.5 4.5l-.5 1.5-4-1C16 12.2 13 14.5 12.5 17.5L11.5 22H9C7.3 22 6 23.3 6 25v2c0 1.7 1.3 3 3 3h1.5v5L8 42c-.4 1.4.4 2.8 1.8 3.2 1.4.4 2.8-.4 3.2-1.8L15 37h1.5v7c0 1.7 1.3 3 3 3s3-1.3 3-3v-7h9v7c0 1.7 1.3 3 3 3s3-1.3 3-3v-7l4 1v6c0 1.7 1.3 3 3 3s3-1.3 3-3v-7l2-2c1.2-1.2 2-2.8 2-4.5V27c0-1.5-.5-3-1.5-4L49 20l2.5-2.5c.8-.8 1.5-2 1.5-3.5V11c0-1.7-1.3-3-3-3zm-16 10c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.88 0.12 75)" }}>{horse.name}</h3>
          <div className="flex gap-2 text-xs flex-wrap" style={{ color: "oklch(0.52 0.05 60)" }}>
            {horse.breed && <span>{horse.breed}</span>}
            {horse.color && <span>· {horse.color}</span>}
            {horse.age != null && <span>· {horse.age} yrs</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: "oklch(0.72 0.16 75)" }}>
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20" style={{ color: "oklch(0.65 0.18 25)" }}>
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronDown className="w-4 h-4 ml-1" style={{ color: "oklch(0.52 0.05 60)" }} /> : <ChevronRight className="w-4 h-4 ml-1" style={{ color: "oklch(0.52 0.05 60)" }} />}
        </div>
      </button>

      {/* Discipline chips */}
      {disciplines.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {disciplines.map((d) => (
            <div key={d} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "oklch(0.25 0.08 55)", color: "oklch(0.78 0.18 80)" }}>
              <img src={DISCIPLINE_IMAGES[d]} alt={DISCIPLINE_LABELS[d]} className="w-4 h-4 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              {DISCIPLINE_LABELS[d]}
            </div>
          ))}
        </div>
      )}

      {/* Expanded section */}
      {expanded && (
        <div className="border-t px-4 pt-4 pb-4 space-y-4" style={{ borderColor: "oklch(0.26 0.05 50)" }}>
          {horse.notes && (
            <div className="rounded-xl p-3" style={{ background: "oklch(0.14 0.03 46)", border: "1px solid oklch(0.24 0.05 50)" }}>
              <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Notes</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(0.78 0.03 70)" }}>{horse.notes}</p>
            </div>
          )}
          <Tabs defaultValue="health">
            <TabsList className="w-full grid grid-cols-4 text-[10px]">
              <TabsTrigger value="health" className="text-[10px] gap-1 px-1"><Stethoscope className="w-3 h-3" />Health</TabsTrigger>
              <TabsTrigger value="reminders" className="text-[10px] gap-1 px-1"><Bell className="w-3 h-3" />Care</TabsTrigger>
              <TabsTrigger value="feeding" className="text-[10px] gap-1 px-1"><Wheat className="w-3 h-3" />Feed</TabsTrigger>
              <TabsTrigger value="receipts" className="text-[10px] gap-1 px-1"><Receipt className="w-3 h-3" />Bills</TabsTrigger>
            </TabsList>
            <TabsContent value="health" className="mt-3"><HealthLogTab horseId={horse.id} horseName={horse.name} /></TabsContent>
            <TabsContent value="reminders" className="mt-3"><CareRemindersTab horseId={horse.id} horseName={horse.name} /></TabsContent>
            <TabsContent value="feeding" className="mt-3"><FeedingTab horseId={horse.id} horseName={horse.name} /></TabsContent>
            <TabsContent value="receipts" className="mt-3"><ReceiptsTab horseId={horse.id} horseName={horse.name} /></TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ─── Add / Edit Horse Dialog ──────────────────────────────────────────────────
function HorseDialog({ open, onClose, editHorse }: {
  open: boolean; onClose: () => void;
  editHorse?: { id: number; name: string; disciplines: string | null; breed: string | null; color: string | null; age: number | null; notes: string | null } | null;
}) {
  const utils = trpc.useUtils();
  const createMutation = trpc.horses.create.useMutation({
    onSuccess: () => { utils.horses.list.invalidate(); toast.success("Horse added!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.horses.update.useMutation({
    onSuccess: () => { utils.horses.list.invalidate(); toast.success("Horse updated!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const initDisciplines: Discipline[] = editHorse?.disciplines ? JSON.parse(editHorse.disciplines) : [];
  const [name, setName] = useState(editHorse?.name ?? "");
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(initDisciplines);
  const [breed, setBreed] = useState(editHorse?.breed ?? "");
  const [color, setColor] = useState(editHorse?.color ?? "");
  const [age, setAge] = useState(editHorse?.age != null ? String(editHorse.age) : "");
  const [notes, setNotes] = useState(editHorse?.notes ?? "");

  const toggleDiscipline = (d: Discipline) => setSelectedDisciplines((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Horse name is required"); return; }
    const payload = { name: name.trim(), disciplines: selectedDisciplines, breed: breed.trim() || undefined, color: color.trim() || undefined, age: age ? parseInt(age) : undefined, notes: notes.trim() || undefined };
    if (editHorse) { updateMutation.mutate({ id: editHorse.id, ...payload }); }
    else { createMutation.mutate(payload); }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.30 0.08 55)", color: "oklch(0.93 0.03 75)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.88 0.12 75)" }}>
            {editHorse ? "Edit Horse" : "Add a Horse"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Horse Name *</Label>
            <Input className="mt-1" placeholder="e.g. Dusty, Thunder, Blaze..." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Breed</Label>
              <Input className="mt-1" placeholder="Quarter Horse..." value={breed} onChange={(e) => setBreed(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Color</Label>
              <Input className="mt-1" placeholder="Bay, Sorrel..." value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Age (years)</Label>
            <Input className="mt-1 w-24" type="number" min="0" max="40" placeholder="7" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "oklch(0.72 0.16 75)" }}>Disciplines</Label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => {
                const selected = selectedDisciplines.includes(d);
                return (
                  <button key={d} type="button" onClick={() => toggleDiscipline(d)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold transition-all border-2 w-[80px]"
                    style={selected
                      ? { background: "oklch(0.72 0.18 75 / 20%)", borderColor: "oklch(0.72 0.18 75)", color: "oklch(0.88 0.12 75)" }
                      : { background: "oklch(0.22 0.05 48)", borderColor: "transparent", color: "oklch(0.52 0.05 60)", border: "1px solid oklch(0.30 0.06 50)" }
                    }
                  >
                    <img src={DISCIPLINE_IMAGES[d]} alt={DISCIPLINE_LABELS[d]} className="w-12 h-12 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-center leading-tight text-[10px]">{DISCIPLINE_LABELS[d]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
            <Textarea
              className="mt-1 resize-none"
              placeholder="Personality, training notes, medical history, special needs, feeding preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              style={{ minHeight: "120px" }}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="flex-1">Cancel</Button>
          <Button className="btn-gold flex-1" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : editHorse ? "Update Horse" : "Add Horse"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Horses Page ─────────────────────────────────────────────────────────
export default function Horses() {
  const { isAuthenticated, loading } = useAuth();
  const { data: horses, isLoading } = trpc.horses.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const deleteHorse = trpc.horses.delete.useMutation({
    onSuccess: () => { utils.horses.list.invalidate(); toast.success("Horse removed"); },
    onError: (e) => toast.error(e.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  type HorseRow = NonNullable<typeof horses>[number];
  const [editHorse, setEditHorse] = useState<HorseRow | null>(null);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.13 0.04 48)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} />
    </div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "oklch(0.13 0.04 48)" }}>
        <p className="text-center" style={{ color: "oklch(0.62 0.05 65)" }}>Sign in to manage your horses</p>
        <Button className="btn-gold" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "oklch(0.13 0.04 48)" }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, oklch(0.16 0.06 48) 0%, oklch(0.20 0.10 55) 50%, oklch(0.16 0.06 48) 100%)" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, oklch(0.72 0.18 75) 0, oklch(0.72 0.18 75) 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.72 0.18 75 / 20%)", color: "oklch(0.72 0.18 75)", border: "1px solid oklch(0.72 0.18 75 / 40%)" }}>
              My Horses
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)" }}>
            Horse Roster
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>
            {horses?.length ?? 0} horse{(horses?.length ?? 0) !== 1 ? "s" : ""} · Health, care & expenses
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 75), transparent)" }} />
      </div>

      <div className="px-4 pt-4 space-y-4">
        <Button className="btn-gold w-full gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add a Horse
        </Button>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />)}
          </div>
        ) : horses?.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="font-semibold" style={{ color: "oklch(0.62 0.05 65)" }}>No horses yet</p>
            <p className="text-sm" style={{ color: "oklch(0.42 0.04 55)" }}>Add your horses and assign them to disciplines</p>
          </div>
        ) : (
          <div className="space-y-3">
            {horses?.map((horse) => (
              <HorseCard key={horse.id} horse={horse} onEdit={() => setEditHorse(horse as HorseRow)} onDelete={() => { if (confirm(`Remove ${horse.name}?`)) deleteHorse.mutate({ id: horse.id }); }} />
            ))}
          </div>
        )}
      </div>

      <HorseDialog open={showAdd || !!editHorse} onClose={() => { setShowAdd(false); setEditHorse(null); }} editHorse={editHorse} />
    </div>
  );
}
