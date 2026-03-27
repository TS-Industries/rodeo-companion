import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, CalendarDays, MapPin, Clock, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  DISCIPLINE_ICONS,
  DISCIPLINE_COLORS,
  RODEO_TYPES,
  RODEO_TYPE_LABELS,
  type Discipline,
  type RodeoType,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

function DisciplineBadge({ discipline }: { discipline: Discipline }) {
  const colors = DISCIPLINE_COLORS[discipline];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", colors.bg, colors.text)}>
      {DISCIPLINE_ICONS[discipline]} {DISCIPLINE_LABELS[discipline]}
    </span>
  );
}

function RodeoCard({ rodeo, onClick }: { rodeo: any; onClick: () => void }) {
  const now = new Date();
  const deadlineDays = differenceInDays(new Date(rodeo.entryDeadline), now);
  const rodeoDays = differenceInDays(new Date(rodeo.rodeoDate), now);
  const isPast = rodeoDays < 0;
  const isDeadlineSoon = deadlineDays >= 0 && deadlineDays <= 3;
  const isDeadlinePassed = deadlineDays < 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{rodeo.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {RODEO_TYPE_LABELS[rodeo.rodeotype as RodeoType]}
          </p>
        </div>
        {rodeo.isEntered ? (
          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Entered
          </span>
        ) : isDeadlineSoon ? (
          <span className="flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            <AlertCircle className="w-3 h-3" /> Deadline Soon
          </span>
        ) : null}
      </div>

      <DisciplineBadge discipline={rodeo.discipline} />

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {isPast ? "Was " : ""}
            {format(new Date(rodeo.rodeoDate), "EEE, MMM d, yyyy")}
            {!isPast && ` · ${rodeoDays === 0 ? "Today!" : `${rodeoDays}d away`}`}
          </span>
        </div>
        {rodeo.locationName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{rodeo.locationName}</span>
          </div>
        )}
        {!isDeadlinePassed && (
          <div className={cn("flex items-center gap-2 text-xs", isDeadlineSoon ? "text-orange-600 font-medium" : "text-muted-foreground")}>
            <Bell className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Entry deadline: {format(new Date(rodeo.entryDeadline), "MMM d")}
              {deadlineDays === 0 ? " (Today!)" : deadlineDays > 0 ? ` · ${deadlineDays}d left` : ""}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function AddRodeoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const createMutation = trpc.rodeos.create.useMutation({
    onSuccess: () => {
      utils.rodeos.list.invalidate();
      toast.success("Rodeo added!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "",
    discipline: "barrel_racing" as Discipline,
    rodeotype: "jackpot" as RodeoType,
    rodeoDate: "",
    entryDeadline: "",
    locationName: "",
    locationAddress: "",
    notes: "",
    notifyDaysBefore: 14,
    autoDeadline: true,
  });

  const handleRodeoDateChange = (val: string) => {
    const newForm = { ...form, rodeoDate: val };
    if (form.autoDeadline && val) {
      const d = new Date(val);
      d.setDate(d.getDate() - form.notifyDaysBefore);
      newForm.entryDeadline = d.toISOString().split("T")[0];
    }
    setForm(newForm);
  };

  const handleSubmit = () => {
    if (!form.name || !form.rodeoDate || !form.entryDeadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      name: form.name,
      discipline: form.discipline,
      rodeotype: form.rodeotype,
      rodeoDate: new Date(form.rodeoDate).getTime(),
      entryDeadline: new Date(form.entryDeadline).getTime(),
      locationName: form.locationName || undefined,
      locationAddress: form.locationAddress || undefined,
      notes: form.notes || undefined,
      notifyDaysBefore: form.notifyDaysBefore,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Add Rodeo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium">Rodeo Name *</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Cheyenne Frontier Days"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Discipline *</Label>
              <Select value={form.discipline} onValueChange={(v) => setForm({ ...form, discipline: v as Discipline })}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINES.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {DISCIPLINE_ICONS[d]} {DISCIPLINE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Type *</Label>
              <Select value={form.rodeotype} onValueChange={(v) => setForm({ ...form, rodeotype: v as RodeoType })}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RODEO_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{RODEO_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Rodeo Date *</Label>
            <Input
              className="mt-1"
              type="date"
              value={form.rodeoDate}
              onChange={(e) => handleRodeoDateChange(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-medium">Entry Deadline *</Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoDeadline}
                  onChange={(e) => setForm({ ...form, autoDeadline: e.target.checked })}
                  className="w-3 h-3"
                />
                Auto (2 weeks before)
              </label>
            </div>
            <Input
              type="date"
              value={form.entryDeadline}
              disabled={form.autoDeadline}
              onChange={(e) => setForm({ ...form, entryDeadline: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Notify me (days before deadline)</Label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={60}
              value={form.notifyDaysBefore}
              onChange={(e) => setForm({ ...form, notifyDaysBefore: parseInt(e.target.value) || 14 })}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Venue / Arena Name</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Frontier Park Arena"
              value={form.locationName}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Address</Label>
            <Input
              className="mt-1"
              placeholder="City, State or full address"
              value={form.locationAddress}
              onChange={(e) => setForm({ ...form, locationAddress: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Notes</Label>
            <Input
              className="mt-1"
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} size="sm">
            {createMutation.isPending ? "Saving…" : "Add Rodeo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Schedule() {
  const [, navigate] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const { data: rodeos, isLoading } = trpc.rodeos.list.useQuery();
  const checkDeadlines = trpc.rodeos.checkDeadlines.useMutation({
    onSuccess: (data) => {
      if (data.notified > 0) toast.success(`Sent ${data.notified} deadline reminder(s)!`);
      else toast.info("No upcoming deadlines to notify right now.");
    },
  });

  const now = new Date();
  const upcoming = rodeos?.filter((r) => new Date(r.rodeoDate) >= now) ?? [];
  const past = rodeos?.filter((r) => new Date(r.rodeoDate) < now) ?? [];

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              🤠 My Schedule
            </h1>
            <p className="text-xs text-muted-foreground">{upcoming.length} upcoming rodeo{upcoming.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => checkDeadlines.mutate()}
              disabled={checkDeadlines.isPending}
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rodeos?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🐎</div>
            <h3 className="font-semibold text-foreground mb-2">No rodeos yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Add your first rodeo to start tracking your schedule and entry deadlines.
            </p>
            <Button onClick={() => setShowAdd(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Your First Rodeo
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="upcoming" className="flex-1">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Past ({past.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No upcoming rodeos</p>
              ) : (
                upcoming.map((r) => (
                  <RodeoCard key={r.id} rodeo={r} onClick={() => navigate(`/schedule/${r.id}`)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="past" className="space-y-3">
              {past.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No past rodeos</p>
              ) : (
                past.map((r) => (
                  <RodeoCard key={r.id} rodeo={r} onClick={() => navigate(`/schedule/${r.id}`)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AddRodeoDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
