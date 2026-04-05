import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  Trophy,
  GraduationCap,
  Users,
  ExternalLink,
  CheckCircle,
  Download,
  Filter,
} from "lucide-react";
import { DISCIPLINE_LABELS, DISCIPLINES } from "../../../drizzle/schema";
import type { Discipline } from "../../../drizzle/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CpraEvent {
  id: number;
  name: string;
  province: string | null;
  city: string | null;
  locationName: string | null;
  locationAddress: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  entryOpenDate: Date | string | null;
  disciplines: string[];
  purseAmount: number | null;
  entryFee: number | null;
  committeeContact: string | null;
  committeePhone: string | null;
  isSpecialEvent: boolean;
  detailsUrl: string | null;
  websiteUrl: string | null;
  meta: {
    source?: string;
    level?: string;
    province?: string;
    note?: string;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVINCES = [
  "All Provinces",
  "Alberta",
  "British Columbia",
  "Saskatchewan",
  "Manitoba",
  "Ontario",
  "Quebec",
  "Nova Scotia",
  "New Brunswick",
  "Prince Edward Island",
  "Newfoundland and Labrador",
];

const LEVELS = [
  { value: "all", label: "All Levels", icon: Trophy, color: "text-amber-400" },
  { value: "professional", label: "Professional", icon: Trophy, color: "text-amber-400" },
  { value: "amateur", label: "Amateur", icon: Users, color: "text-blue-400" },
  { value: "high_school", label: "High School / Jr High", icon: GraduationCap, color: "text-green-400" },
];

const SOURCE_LABELS: Record<string, string> = {
  cpra: "CPRA",
  wra: "WRA",
  kcra: "KCRA",
  ram: "RAM Rodeo",
  ahsra: "AHSRA",
  lra: "LRA",
  fca: "FCA",
};

const LEVEL_COLORS: Record<string, string> = {
  professional: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  amateur: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  high_school: "bg-green-500/20 text-green-300 border-green-500/30",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null): string {
  if (!d) return "TBD";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateRange(start: Date | string | null, end: Date | string | null): string {
  if (!start) return "TBD";
  const s = typeof start === "string" ? new Date(start) : start;
  if (!end) return formatDate(s);
  const e = typeof end === "string" ? new Date(end) : end;
  if (s.toDateString() === e.toDateString()) return formatDate(s);
  const sStr = s.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  const eStr = e.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  return `${sStr} – ${eStr}`;
}

// ─── Import Dialog ────────────────────────────────────────────────────────────

function ImportDialog({
  event,
  onClose,
  onImported,
  defaultDisciplines,
}: {
  event: CpraEvent;
  onClose: () => void;
  onImported: (rodeoId: number | null) => void;
  defaultDisciplines: Discipline[];
}) {
  // Pre-select the user's most frequently competed disciplines.
  // They can deselect as needed before importing.
  const allDisciplines = DISCIPLINES as readonly Discipline[];
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(defaultDisciplines);

  const importMutation = trpc.events.import.useMutation({
    onSuccess: (data) => {
      toast.success(`"${event.name}" added to your schedule!`);
      onImported(data.rodeoId);
    },
    onError: (err) => {
      toast.error(`Import failed: ${err.message}`);
    },
  });

  const toggleDiscipline = (d: Discipline) => {
    setSelectedDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleImport = () => {
    if (selectedDisciplines.length === 0) {
      toast.error("Please select at least one discipline");
      return;
    }
    importMutation.mutate({
      eventId: event.id,
      disciplines: selectedDisciplines,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1208] border-amber-900/40 text-amber-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-300 text-lg">Add to My Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-amber-200 text-base">{event.name}</p>
            <p className="text-amber-400/70 text-sm mt-1">
              {formatDateRange(event.startDate, event.endDate)}
              {event.city && ` · ${event.city}, ${event.province ?? ""}`}
            </p>
          </div>

          <div>
            <p className="text-amber-300/80 text-sm font-medium mb-2">
              Select your disciplines:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(allDisciplines as Discipline[]).map((d) => {
                const selected = selectedDisciplines.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDiscipline(d)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                      selected
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-200"
                        : "bg-black/20 border-amber-900/30 text-amber-400/60 hover:border-amber-700/50"
                    }`}
                  >
                    {selected && <CheckCircle className="inline w-3 h-3 mr-1 text-amber-400" />}
                    {DISCIPLINE_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {event.entryOpenDate && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
              <span className="text-amber-300 font-medium">Entry Opens: </span>
              <span className="text-amber-200">{formatDate(event.entryOpenDate)}</span>
            </div>
          )}

          {event.committeeContact && (
            <div className="text-xs text-amber-400/60">
              <span className="font-medium">Contact: </span>
              {event.committeeContact}
              {event.committeePhone && ` · ${event.committeePhone}`}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-amber-900/40 text-amber-400 hover:bg-amber-900/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || selectedDisciplines.length === 0}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold"
            >
              {importMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Add to Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  onImport,
}: {
  event: CpraEvent;
  onImport: (event: CpraEvent) => void;
}) {
  const level = event.meta?.level ?? "professional";
  const source = event.meta?.source ?? "cpra";
  const levelColor = LEVEL_COLORS[level] ?? LEVEL_COLORS.professional;
  const isPast = event.startDate
    ? new Date(event.startDate) < new Date()
    : false;

  return (
    <div
      className={`bg-[#1a1208]/80 border rounded-xl p-4 space-y-3 transition-all hover:border-amber-700/50 ${
        event.isSpecialEvent
          ? "border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
          : "border-amber-900/30"
      } ${isPast ? "opacity-60" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={`text-xs border ${levelColor} px-2 py-0`}>
              {level === "high_school" ? "High School" : level === "amateur" ? "Amateur" : "Pro"}
            </Badge>
            <Badge className="text-xs bg-black/30 border-amber-900/30 text-amber-400/70 px-2 py-0">
              {SOURCE_LABELS[source] ?? source.toUpperCase()}
            </Badge>
            {event.isSpecialEvent && (
              <Badge className="text-xs bg-amber-500/20 border-amber-500/40 text-amber-300 px-2 py-0">
                ★ Special
              </Badge>
            )}
          </div>
          <h3 className="font-bold text-amber-200 text-sm leading-tight line-clamp-2">
            {event.name}
          </h3>
        </div>
        {event.purseAmount && (
          <div className="text-right shrink-0">
            <div className="text-amber-400 font-bold text-sm">
              ${event.purseAmount.toLocaleString()}
            </div>
            <div className="text-amber-600/60 text-xs">added $</div>
          </div>
        )}
      </div>

      {/* Date & Location */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-amber-300/80 text-xs">
          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>
        {(event.city || event.province) && (
          <div className="flex items-center gap-2 text-amber-300/70 text-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {[event.locationName, event.city, event.province]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}
        {event.entryOpenDate && (
          <div className="flex items-center gap-2 text-green-400/80 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <span>Entries open: {formatDate(event.entryOpenDate)}</span>
          </div>
        )}
      </div>

      {/* Disciplines */}
      {event.disciplines.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {event.disciplines.slice(0, 4).map((d) => (
            <span
              key={d}
              className="text-xs bg-black/30 border border-amber-900/30 text-amber-400/70 px-2 py-0.5 rounded-full"
            >
              {DISCIPLINE_LABELS[d as Discipline] ?? d}
            </span>
          ))}
          {event.disciplines.length > 4 && (
            <span className="text-xs text-amber-500/60">
              +{event.disciplines.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Note */}
      {event.meta?.note && (
        <p className="text-xs text-amber-400/50 italic">{event.meta.note}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => onImport(event)}
          disabled={isPast}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs h-8"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Add to Schedule
        </Button>
        {event.detailsUrl && (
          <Button
            size="sm"
            variant="outline"
            asChild
            className="border-amber-900/40 text-amber-400 hover:bg-amber-900/20 h-8 px-3"
          >
            <a href={event.detailsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BrowseEvents() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [level, setLevel] = useState("all");
  const [importingEvent, setImportingEvent] = useState<CpraEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: events = [], isLoading, refetch } = trpc.events.list.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: count = 0 } = trpc.events.count.useQuery();

  // Infer the user's most frequently competed disciplines from their rodeo history
  const { data: userRodeos = [] } = trpc.rodeos.list.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const frequentDisciplines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of userRodeos) {
      try {
        const discs: string[] = typeof r.disciplines === "string" ? JSON.parse(r.disciplines) : [];
        for (const d of discs) counts.set(d, (counts.get(d) ?? 0) + 1);
      } catch { /* skip malformed */ }
    }
    // Return disciplines sorted by frequency (most used first)
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([d]) => d as Discipline);
  }, [userRodeos]);

  const scrapeMutation = trpc.events.scrape.useMutation({
    onSuccess: (result) => {
      toast.success(`Refreshed! Found ${result.total} events from all sources.`);
      refetch();
    },
    onError: (err) => {
      toast.error(`Refresh failed: ${err.message}`);
    },
  });

  const filtered = useMemo(() => {
    let list = events as CpraEvent[];

    // Future-only filtering is now handled server-side via futureOnly param

    if (province !== "All Provinces") {
      list = list.filter((e) => e.province === province);
    }
    if (level !== "all") {
      list = list.filter((e) => e.meta?.level === level);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.province?.toLowerCase().includes(q)
      );
    }

    // Sort soonest first
    list = [...list].sort((a, b) => {
      const aTime = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      return aTime - bTime;
    });

    return list;
  }, [events, province, level, search]);

  const handleImported = (rodeoId: number | null) => {
    setImportingEvent(null);
    // Always navigate to the schedule list — the rodeoId may not be available
    // due to MySQL insertId extraction timing; user can find their new rodeo there
    setTimeout(() => navigate("/schedule"), 500);
  };

  return (
    <div className="min-h-screen bg-[#0d0a05] text-amber-100 pb-24">
      {/* Header */}
      <div
        className="relative px-4 pt-12 pb-6"
        style={{
          background: "linear-gradient(180deg, #1a0f00 0%, #0d0a05 100%)",
          borderBottom: "1px solid rgba(180,120,20,0.2)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/schedule")}
            className="p-2 rounded-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-amber-300">Browse Canadian Rodeos</h1>
            <p className="text-amber-500/70 text-xs mt-0.5">
              {count > 0 ? `${count} events from CPRA, WRA, KCRA, LRA, FCA, RAM Rodeo & AHSRA` : "Loading events..."}
            </p>
          </div>
          {user && (
            <button
              onClick={() => scrapeMutation.mutate()}
              disabled={scrapeMutation.isPending}
              className="ml-auto p-2 rounded-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 transition-colors"
              title="Refresh from all sources"
            >
              <RefreshCw
                className={`w-4 h-4 ${scrapeMutation.isPending ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rodeos, cities, provinces..."
            className="pl-9 bg-black/30 border-amber-900/40 text-amber-200 placeholder:text-amber-600/50 focus:border-amber-600/60 h-10"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 mt-3 text-amber-400/70 text-sm hover:text-amber-300 transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? "Hide filters" : "Show filters"}
          {(province !== "All Provinces" || level !== "all") && (
            <span className="bg-amber-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {[province !== "All Provinces", level !== "all"].filter(Boolean).length}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Level filter */}
            <div>
              <p className="text-amber-400/60 text-xs mb-2">Competition Level</p>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      level === l.value
                        ? "bg-amber-600/30 border-amber-500/60 text-amber-200"
                        : "bg-black/20 border-amber-900/30 text-amber-500/60 hover:border-amber-700/50"
                    }`}
                  >
                    <l.icon className={`w-3 h-3 ${l.color}`} />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Province filter */}
            <div>
              <p className="text-amber-400/60 text-xs mb-2">Province</p>
              <div className="flex flex-wrap gap-2">
                {PROVINCES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvince(p)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      province === p
                        ? "bg-amber-600/30 border-amber-500/60 text-amber-200"
                        : "bg-black/20 border-amber-900/30 text-amber-500/60 hover:border-amber-700/50"
                    }`}
                  >
                    {p === "All Provinces" ? "All" : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#1a1208]/60 border border-amber-900/20 rounded-xl p-4 animate-pulse h-36"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {count === 0 ? (
              <div className="space-y-4">
                <div className="text-5xl">🤠</div>
                <p className="text-amber-300 font-semibold">No events loaded yet</p>
                <p className="text-amber-500/60 text-sm max-w-xs mx-auto">
                  Tap the refresh button to fetch the latest schedule from CPRA, WRA, KCRA, RAM Rodeo, and AHSRA.
                </p>
                {user && (
                  <Button
                    onClick={() => scrapeMutation.mutate()}
                    disabled={scrapeMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-500 text-black font-bold"
                  >
                    {scrapeMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {scrapeMutation.isPending ? "Fetching events..." : "Fetch Events Now"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl">🔍</div>
                <p className="text-amber-300 font-semibold">No events match your filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setProvince("All Provinces");
                    setLevel("all");
                  }}
                  className="border-amber-900/40 text-amber-400"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-amber-500/60 text-xs">
              Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              {province !== "All Provinces" && ` in ${province}`}
              {level !== "all" && ` · ${LEVELS.find((l) => l.value === level)?.label}`}
            </p>
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onImport={setImportingEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Import Dialog */}
      {importingEvent && (
        <ImportDialog
          event={importingEvent}
          onClose={() => setImportingEvent(null)}
          onImported={handleImported}
          defaultDisciplines={frequentDisciplines}
        />
      )}
    </div>
  );
}
