/// <reference types="@types/google.maps" />
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, CalendarDays, MapPin, Clock, Bell, CheckCircle2, AlertCircle, Search, ParkingCircle, X } from "lucide-react";
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  DISCIPLINE_ICONS,
  DISCIPLINE_IMAGES,
  DISCIPLINE_COLORS,
  RODEO_TYPES,
  RODEO_TYPE_LABELS,
  type Discipline,
  type RodeoType,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { MapView } from "@/components/Map";

// ─── Discipline multi-select chip ────────────────────────────────────────────
function DisciplineChip({ discipline, selected, onToggle }: { discipline: Discipline; selected: boolean; onToggle: () => void }) {
  const colors = DISCIPLINE_COLORS[discipline];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold transition-all border-2 w-[90px]",
        selected
          ? `${colors.bg} ${colors.text} border-current shadow-lg scale-105`
          : "border-transparent hover:scale-102"
      )}
      style={selected ? { borderColor: colors.accent } : { background: "oklch(0.22 0.05 48)", color: "oklch(0.52 0.05 60)", border: "1px solid oklch(0.30 0.06 50)" }}
    >
      <img
        src={DISCIPLINE_IMAGES[discipline]}
        alt={DISCIPLINE_LABELS[discipline]}
        className="w-14 h-14 object-cover rounded-lg"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <span className="text-center leading-tight">{DISCIPLINE_LABELS[discipline]}</span>
    </button>
  );
}

// ─── Venue autocomplete input ─────────────────────────────────────────────────
function VenueSearchInput({
  value,
  onChange,
  mapReady,
}: {
  value: string;
  onChange: (address: string, name: string, lat: number, lng: number, placeId: string, countryCode: string) => void;
  mapReady: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => { setLocalVal(value); }, [value]);

  useEffect(() => {
    if (!mapReady || !inputRef.current || acRef.current) return;
    try {
      const ac = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["establishment", "geocode"],
        fields: ["formatted_address", "geometry", "name", "place_id", "address_components"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        const addr = place.formatted_address || "";
        const name = place.name || addr;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const placeId = place.place_id || "";
        // Detect country from address_components
        const countryComp = place.address_components?.find(c => c.types.includes("country"));
        const countryCode = countryComp?.short_name || "US";
        setLocalVal(name + (addr && addr !== name ? ` — ${addr}` : ""));
        onChange(addr, name, lat, lng, placeId, countryCode);
      });
      acRef.current = ac;
    } catch (e) {
      console.warn("Venue autocomplete init failed:", e);
    }
  }, [mapReady, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "oklch(0.52 0.05 60)" }} />
      <input
        ref={inputRef}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        placeholder="Search arena, fairgrounds, rodeo venue…"
        className="w-full h-9 pl-9 pr-3 text-sm rounded-lg outline-none"
        style={{ background: "oklch(0.20 0.05 48)", border: "1px solid oklch(0.32 0.07 55)", color: "oklch(0.93 0.03 75)" }}
      />
    </div>
  );
}

// ─── Rodeo card ───────────────────────────────────────────────────────────────
function RodeoCard({ rodeo, onClick }: { rodeo: any; onClick: () => void }) {
  const now = new Date();
  const deadlineDays = differenceInDays(new Date(rodeo.entryDeadline), now);
  const rodeoDays = differenceInDays(new Date(rodeo.rodeoDate), now);
  const isPast = rodeoDays < 0;
  const isDeadlineSoon = deadlineDays >= 0 && deadlineDays <= 3;
  const isDeadlinePassed = deadlineDays < 0;

  // Parse multi-discipline list
  let disciplineList: Discipline[] = [];
  try {
    disciplineList = rodeo.disciplines ? JSON.parse(rodeo.disciplines) : [rodeo.discipline];
  } catch {
    disciplineList = [rodeo.discipline];
  }

  const accentColor = isPast ? "oklch(0.45 0.04 55)" : isDeadlineSoon ? "oklch(0.78 0.18 80)" : "oklch(0.72 0.16 75)";

  return (
    <button
      onClick={onClick}
      className="w-full text-left card-shimmer card-hover rounded-2xl overflow-hidden"
      style={{ borderColor: `${accentColor}40` }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, oklch(0.55 0.20 25), ${accentColor}, transparent)` }} />
      <div className="p-4">
        {/* Header row with countdown */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base truncate leading-tight"
              style={{ color: "oklch(0.93 0.03 75)", fontFamily: "'Playfair Display', serif", textShadow: `0 0 20px ${accentColor}30` }}>
              {rodeo.name}
            </h3>
            <p className="text-xs mt-0.5 font-semibold uppercase tracking-wide" style={{ color: "oklch(0.62 0.05 65)" }}>
              {RODEO_TYPE_LABELS[rodeo.rodeotype as RodeoType]}
            </p>
          </div>
          {/* Countdown badge */}
          {!isPast && (
            <div className="flex-shrink-0 text-center">
              <p className="text-3xl font-black leading-none"
                style={{ color: accentColor, fontFamily: "'Playfair Display', serif", textShadow: `0 0 16px ${accentColor}60` }}>
                {rodeoDays === 0 ? "🎯" : rodeoDays}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>
                {rodeoDays === 0 ? "today" : "days"}
              </p>
            </div>
          )}
          {isPast && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
              style={{ background: "oklch(0.28 0.04 50)", color: "oklch(0.52 0.05 60)" }}>Past</span>
          )}
        </div>

        {/* Status badge row */}
        <div className="flex items-center gap-2 mb-2.5">
          {rodeo.isEntered && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold"
              style={{ background: "oklch(0.65 0.14 145 / 20%)", color: "oklch(0.65 0.14 145)", border: "1px solid oklch(0.65 0.14 145 / 30%)" }}>
              <CheckCircle2 className="w-3 h-3" /> Entered
            </span>
          )}
          {isDeadlineSoon && !rodeo.isEntered && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold countdown-urgent"
              style={{ background: "oklch(0.72 0.16 75 / 20%)", color: "oklch(0.78 0.18 80)", border: "1px solid oklch(0.72 0.16 75 / 40%)" }}>
              <AlertCircle className="w-3 h-3" /> Deadline Soon
            </span>
          )}
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

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.72 0.06 65)" }}>
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }} />
            <span className="font-medium">
              {isPast ? "Was " : ""}
              {format(new Date(rodeo.rodeoDate), "EEE, MMM d, yyyy")}
            </span>
          </div>
          {rodeo.locationName && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.62 0.05 65)" }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.62 0.05 65)" }} />
              <span className="truncate">{rodeo.locationName}</span>
            </div>
          )}
          {!isDeadlinePassed && (
            <div className={cn("flex items-center gap-2 text-xs font-medium")}
              style={{ color: isDeadlineSoon ? "oklch(0.78 0.18 80)" : "oklch(0.52 0.05 60)" }}>
              <Bell className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Entry deadline: {format(new Date(rodeo.entryDeadline), "MMM d")}
                {deadlineDays === 0 ? " (Today!)" : deadlineDays > 0 ? ` · ${deadlineDays}d left` : ""}
              </span>
            </div>
          )}
        </div>
        {/* Quick-action hint */}
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid oklch(0.28 0.06 50)" }}>
          <span className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>Tap to view runs, expenses &amp; map</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full btn-action">💰 Expenses →</span>
        </div>
      </div>
    </button>
  );
}

// ─── Add Rodeo Dialog ─────────────────────────────────────────────────────────
function AddRodeoDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: (id: number) => void }) {
  const utils = trpc.useUtils();
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hiddenMapRef = useRef<google.maps.Map | null>(null);

  const createMutation = trpc.rodeos.create.useMutation({
    onSuccess: (data) => {
      utils.rodeos.list.invalidate();
      toast.success("🤠 Rodeo added!");
      onClose();
      if (onSaved && data?.id) onSaved(data.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "",
    selectedDisciplines: ["barrel_racing"] as Discipline[],
    rodeotype: "jackpot" as RodeoType,
    rodeoDate: "",
    entryDeadline: "",
    locationName: "",
    locationAddress: "",
    locationLat: undefined as number | undefined,
    locationLng: undefined as number | undefined,
    locationPlaceId: "",
    parkingNotes: "",
    countryCode: "US",
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

  const handleVenueSelect = useCallback((address: string, name: string, lat: number, lng: number, placeId: string, countryCode: string) => {
    setForm(prev => ({ ...prev, locationAddress: address, locationName: name, locationLat: lat, locationLng: lng, locationPlaceId: placeId, countryCode }));
  }, []);

  const toggleDiscipline = (d: Discipline) => {
    setForm(prev => {
      const exists = prev.selectedDisciplines.includes(d);
      if (exists && prev.selectedDisciplines.length === 1) return prev; // keep at least 1
      return {
        ...prev,
        selectedDisciplines: exists
          ? prev.selectedDisciplines.filter(x => x !== d)
          : [...prev.selectedDisciplines, d],
      };
    });
  };

  const handleSubmit = () => {
    if (!form.name || !form.rodeoDate || !form.entryDeadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    const primaryDiscipline = form.selectedDisciplines[0];
    createMutation.mutate({
      name: form.name,
      discipline: primaryDiscipline,
      disciplines: form.selectedDisciplines,
      rodeotype: form.rodeotype,
      rodeoDate: new Date(form.rodeoDate).getTime(),
      entryDeadline: new Date(form.entryDeadline).getTime(),
      locationName: form.locationName || undefined,
      locationAddress: form.locationAddress || undefined,
      locationLat: form.locationLat,
      locationLng: form.locationLng,
      locationPlaceId: form.locationPlaceId || undefined,
      parkingNotes: form.parkingNotes || undefined,
      countryCode: form.countryCode,
      notes: form.notes || undefined,
      notifyDaysBefore: form.notifyDaysBefore,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm mx-auto max-h-[92vh] overflow-y-auto"
        style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
            🤠 Add New Rodeo
          </DialogTitle>
        </DialogHeader>

        {/* Hidden map for Places API */}
        <div ref={mapContainerRef} style={{ width: 1, height: 1, overflow: "hidden", position: "absolute" }}>
          <MapView
            onMapReady={(map) => { hiddenMapRef.current = map; setMapReady(true); }}
            initialCenter={{ lat: 39.8, lng: -98.5 }}
            initialZoom={4}
            className="w-full h-full"
          />
        </div>

        <div className="space-y-4 py-2">
          {/* Rodeo Name */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Rodeo Name *</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Cheyenne Frontier Days"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Disciplines multi-select */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              Disciplines * <span className="font-normal" style={{ color: "oklch(0.52 0.05 60)" }}>(select all that apply)</span>
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DISCIPLINES.map((d) => (
                <DisciplineChip
                  key={d}
                  discipline={d}
                  selected={form.selectedDisciplines.includes(d)}
                  onToggle={() => toggleDiscipline(d)}
                />
              ))}
            </div>
          </div>

          {/* Rodeo Type */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Rodeo Type *</Label>
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

          {/* Rodeo Date — calendar input */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Rodeo Date *</Label>
            <div className="relative mt-1">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "oklch(0.72 0.16 75)" }} />
              <Input
                type="date"
                className="pl-9"
                value={form.rodeoDate}
                onChange={(e) => handleRodeoDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Entry Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Entry Deadline *</Label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "oklch(0.52 0.05 60)" }}>
                <input
                  type="checkbox"
                  checked={form.autoDeadline}
                  onChange={(e) => setForm({ ...form, autoDeadline: e.target.checked })}
                  className="w-3 h-3 accent-amber-500"
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

          {/* Notify days */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Remind me (days before deadline)</Label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={60}
              value={form.notifyDaysBefore}
              onChange={(e) => setForm({ ...form, notifyDaysBefore: parseInt(e.target.value) || 14 })}
            />
          </div>

          {/* Venue lookup */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              Venue / Arena <span className="font-normal" style={{ color: "oklch(0.52 0.05 60)" }}>(search Google Maps)</span>
            </Label>
            <div className="mt-1">
              <VenueSearchInput
                value={form.locationName}
                onChange={handleVenueSelect}
                mapReady={mapReady}
              />
            </div>
            {form.locationAddress && (
              <div className="mt-1.5 flex items-start gap-1.5 text-xs" style={{ color: "oklch(0.65 0.14 145)" }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{form.locationAddress}</span>
                {form.countryCode === "CA" && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "oklch(0.55 0.20 250 / 20%)", color: "oklch(0.65 0.18 250)" }}>🇨🇦 CA</span>
                )}
              </div>
            )}
          </div>

          {/* Parking notes */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              Parking Notes <span className="font-normal" style={{ color: "oklch(0.52 0.05 60)" }}>(for large rigs / horse trailers)</span>
            </Label>
            <Input
              className="mt-1"
              placeholder="e.g. Large trailer parking on north side, gate 3"
              value={form.parkingNotes}
              onChange={(e) => setForm({ ...form, parkingNotes: e.target.value })}
            />
          </div>

          {/* General notes */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
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
          <Button onClick={handleSubmit} disabled={createMutation.isPending} size="sm" className="btn-gold">
            {createMutation.isPending ? "Saving…" : "★ Save Rodeo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Schedule Page ───────────────────────────────────────────────────────
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
      {/* ── Flashy Hero Header ── */}
      <div className="hero-western relative px-4 pt-10 pb-5">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">🤠</div>
        <div className="absolute top-8 right-14 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute top-5 left-6 text-xs opacity-10 select-none pointer-events-none">★</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Rodeo Schedule ✦</p>
            <h1 className="text-3xl font-black leading-none mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
              My Schedule
            </h1>
            <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>
              {upcoming.length} upcoming rodeo{upcoming.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-full"
              style={{ border: "1px solid oklch(0.72 0.16 75 / 30%)", color: "oklch(0.72 0.16 75)" }}
              onClick={() => checkDeadlines.mutate()} disabled={checkDeadlines.isPending}>
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 rounded-full px-3 text-xs font-bold"
              style={{ border: "1px solid oklch(0.72 0.16 75 / 30%)", color: "oklch(0.72 0.16 75)" }}
              onClick={() => navigate("/browse-events")}>
              🍁 Browse
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="btn-gold gap-1.5 rounded-full px-4">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />
            ))}
          </div>
        ) : rodeos?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🐎</div>
            <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
              No rodeos yet
            </h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
              Add your first rodeo to start tracking your schedule and entry deadlines.
            </p>
            <Button onClick={() => setShowAdd(true)} className="btn-gold gap-2 rounded-full px-6">
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
                <p className="text-center text-sm py-8" style={{ color: "oklch(0.52 0.05 60)" }}>No upcoming rodeos</p>
              ) : (
                upcoming.map((r) => (
                  <RodeoCard key={r.id} rodeo={r} onClick={() => navigate(`/schedule/${r.id}`)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="past" className="space-y-3">
              {past.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: "oklch(0.52 0.05 60)" }}>No past rodeos</p>
              ) : (
                past.map((r) => (
                  <RodeoCard key={r.id} rodeo={r} onClick={() => navigate(`/schedule/${r.id}`)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AddRodeoDialog open={showAdd} onClose={() => setShowAdd(false)} onSaved={(id) => navigate(`/schedule/${id}`)} />
    </div>
  );
}
