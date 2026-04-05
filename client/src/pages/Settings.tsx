import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, User, LogOut, Shield, Loader2, Globe, Fuel, Trophy, ExternalLink } from "lucide-react";
import { useUnits, type UnitSystem } from "@/contexts/UnitContext";

// ─��─ Association Deep Links ──────────────────────────────────────────────────
const ASSOCIATIONS = [
  { code: "AHSRA", name: "Alberta High School Rodeo", website: "https://www.equestevents.ca", standingsLabel: "EQuest Events", standingsUrl: "https://www.equestevents.ca" },
  { code: "LRA", name: "Lakeland Rodeo Association", website: "https://lakelandrodeo.com", standingsLabel: "LRA Standings", standingsUrl: "https://lakelandrodeo.com" },
  { code: "WRA", name: "Wildrose Rodeo Association", website: "https://wrarodeo.com", standingsLabel: "WRA Standings", standingsUrl: "https://wrarodeo.com" },
  { code: "CPRA", name: "Canadian Pro Rodeo Association", website: "https://rodeocanada.com", standingsLabel: "CPRA Standings", standingsUrl: "https://rodeocanada.com" },
  { code: "FCA", name: "Foothills Cowboys Association", website: "https://foothillscowboys.com", standingsLabel: "FCA Standings", standingsUrl: "https://foothillscowboys.com" },
  { code: "KCRA", name: "Kananaskis Country Rodeo Assoc.", website: "https://kcra.ca", standingsLabel: "KCRA Standings", standingsUrl: "https://kcra.ca" },
  { code: "RAM", name: "Rodeo Alberta Members", website: "https://rodeoalberta.com", standingsLabel: "RAM Standings", standingsUrl: "https://rodeoalberta.com" },
] as const;

type AssociationCode = (typeof ASSOCIATIONS)[number]["code"];

function useSelectedAssociations() {
  const [selected, setSelected] = useState<AssociationCode[]>(() => {
    try {
      const stored = localStorage.getItem("rodeo_associations");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const toggle = (code: AssociationCode) => {
    setSelected((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      localStorage.setItem("rodeo_associations", JSON.stringify(next));
      return next;
    });
  };

  return { selected, toggle };
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { unitSystem, setUnitSystem, isCanada } = useUnits();
  const { data: prefs, isLoading: prefsLoading } = trpc.notifications.getPrefs.useQuery();
  const updatePrefs = trpc.notifications.updatePrefs.useMutation({
    onSuccess: () => toast.success("Settings saved!"),
    onError: (e) => toast.error(e.message),
  });
  const checkDeadlines = trpc.rodeos.checkDeadlines.useMutation({
    onSuccess: (data) => {
      if (data.notified > 0) toast.success(`Sent ${data.notified} deadline reminder(s)!`);
      else toast.info("No upcoming deadlines right now.");
    },
  });

  const { selected: selectedAssociations, toggle: toggleAssociation } = useSelectedAssociations();

  const [enableDeadline, setEnableDeadline] = useState(true);
  const [daysBefore, setDaysBefore] = useState(14);

  // Season goal
  const currentYear = new Date().getFullYear();
  const { data: seasonGoal, refetch: refetchGoal } = trpc.seasonGoals.get.useQuery({ year: currentYear });
  const upsertGoal = trpc.seasonGoals.upsert.useMutation({
    onSuccess: () => { toast.success("Season goal saved! 🏆"); refetchGoal(); },
    onError: (e) => toast.error(e.message),
  });
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    if (seasonGoal) setGoalInput(String((seasonGoal.targetCents / 100).toFixed(0)));
  }, [seasonGoal]);

  useEffect(() => {
    if (prefs) {
      setEnableDeadline(prefs.enableEntryDeadline ?? true);
      setDaysBefore(prefs.defaultDaysBefore ?? 14);
    }
  }, [prefs]);

  const handleSave = () => {
    updatePrefs.mutate({ enableEntryDeadline: enableDeadline, defaultDaysBefore: daysBefore });
  };

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid oklch(0.30 0.06 50)", background: "oklch(0.16 0.04 46)" }}>
      {icon}
      <h2 className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* ── Flashy Hero Header ── */}
      <div className="hero-western relative px-4 pt-10 pb-6">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">⚙️</div>
        <div className="absolute top-8 right-14 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Preferences ✦</p>
          <h1 className="text-3xl font-black leading-none mb-1"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
            Settings
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>Account, units &amp; notifications</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-28">
        {/* Profile card */}
        <div className="card-western rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "oklch(0.72 0.16 75 / 15%)", border: "2px solid oklch(0.72 0.16 75 / 40%)" }}>
              <User className="w-6 h-6" style={{ color: "oklch(0.78 0.18 80)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold" style={{ color: "oklch(0.93 0.03 75)" }}>{user?.name ?? "Rodeo Competitor"}</p>
              <p className="text-xs truncate" style={{ color: "oklch(0.52 0.05 60)" }}>{user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* ─── Season Goal ─── */}
        <div className="card-western rounded-xl overflow-hidden">
          {sectionHeader(<Trophy className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />, `${currentYear} Season Prize Money Goal`)}
          <div className="p-4 space-y-3">
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
              Set a target prize money goal for the {currentYear} season. Your progress will be shown on the Dashboard.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "oklch(0.72 0.16 75)" }}>$</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 5000"
                  className="pl-7"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="btn-gold flex-shrink-0"
                disabled={upsertGoal.isPending || !goalInput}
                onClick={() => {
                  const val = parseFloat(goalInput);
                  if (isNaN(val) || val < 0) { toast.error("Enter a valid dollar amount"); return; }
                  upsertGoal.mutate({ year: currentYear, targetDollars: val });
                }}
              >
                {upsertGoal.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Goal"}
              </Button>
            </div>
            {seasonGoal && seasonGoal.targetCents > 0 && (
              <p className="text-xs" style={{ color: "oklch(0.65 0.14 145)" }}>
                ✓ Current goal: ${(seasonGoal.targetCents / 100).toLocaleString()} for {currentYear}
              </p>
            )}
          </div>
        </div>

        {/* ─── My Associations ─── */}
        <div className="card-western rounded-xl overflow-hidden">
          {sectionHeader(<ExternalLink className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />, "My Associations")}
          <div className="p-4 space-y-3">
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
              Select the associations you compete in. Quick links will appear below.
            </p>
            <div className="flex flex-wrap gap-2">
              {ASSOCIATIONS.map((a) => {
                const isActive = selectedAssociations.includes(a.code);
                return (
                  <button
                    key={a.code}
                    onClick={() => toggleAssociation(a.code)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: isActive ? "oklch(0.72 0.16 75 / 20%)" : "oklch(0.20 0.04 48)",
                      border: `1.5px solid ${isActive ? "oklch(0.72 0.16 75)" : "oklch(0.28 0.06 50)"}`,
                      color: isActive ? "oklch(0.78 0.18 80)" : "oklch(0.52 0.05 60)",
                    }}
                  >
                    {isActive ? "✓ " : ""}{a.code}
                  </button>
                );
              })}
            </div>

            {selectedAssociations.length > 0 && (
              <div className="space-y-2 pt-1">
                {ASSOCIATIONS.filter((a) => selectedAssociations.includes(a.code)).map((a) => (
                  <div key={a.code} className="rounded-xl p-3" style={{ background: "oklch(0.20 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
                    <p className="text-xs font-bold mb-1.5" style={{ color: "oklch(0.88 0.03 70)" }}>{a.name}</p>
                    <div className="flex gap-2">
                      <a
                        href={a.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors active:scale-[0.98]"
                        style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.78 0.18 80)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}
                      >
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                      <a
                        href={a.standingsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors active:scale-[0.98]"
                        style={{ background: "oklch(0.65 0.14 145 / 15%)", color: "oklch(0.72 0.16 145)", border: "1px solid oklch(0.65 0.14 145 / 30%)" }}
                      >
                        <Trophy className="w-3.5 h-3.5" /> {a.standingsLabel}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Region & Units ─── */}
        <div className="card-western rounded-xl overflow-hidden">
          {sectionHeader(<Globe className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />, "Region & Units")}
          <div className="p-4 space-y-4">
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
              Choose your region to automatically switch between metric (Canada) and imperial (USA) units for distances, fuel economy, and trip budgets.
            </p>

            {/* Toggle buttons */}
            <div className="grid grid-cols-2 gap-3">
              {(["US", "CA"] as UnitSystem[]).map((sys) => {
                const isSelected = unitSystem === sys;
                const flag = sys === "US" ? "🇺🇸" : "🍁";
                const label = sys === "US" ? "United States" : "Canada";
                const sub = sys === "US" ? "Miles · MPG · USD" : "Kilometres · L/100km · CAD";
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => {
                      setUnitSystem(sys);
                      toast.success(`Switched to ${label} units`);
                    }}
                    className="rounded-xl p-4 text-left transition-all"
                    style={{
                      background: isSelected ? "oklch(0.72 0.16 75 / 15%)" : "oklch(0.20 0.04 48)",
                      border: `2px solid ${isSelected ? "oklch(0.72 0.16 75)" : "oklch(0.28 0.06 50)"}`,
                      boxShadow: isSelected ? "0 0 16px oklch(0.72 0.16 75 / 25%)" : "none",
                    }}
                  >
                    <div className="text-2xl mb-1">{flag}</div>
                    <p className="text-sm font-bold" style={{ color: isSelected ? "oklch(0.78 0.18 80)" : "oklch(0.62 0.05 65)" }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: isSelected ? "oklch(0.62 0.10 70)" : "oklch(0.42 0.04 55)" }}>{sub}</p>
                    {isSelected && (
                      <div className="mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: "oklch(0.72 0.16 75 / 20%)", color: "oklch(0.78 0.18 80)" }}>
                        ✓ Active
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current unit summary */}
            <div className="rounded-lg p-3 space-y-1.5" style={{ background: "oklch(0.20 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>Current Units</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span style={{ color: "oklch(0.52 0.05 60)" }}>Distance</span>
                <span className="font-semibold" style={{ color: "oklch(0.78 0.18 80)" }}>{isCanada ? "Kilometres (km)" : "Miles (mi)"}</span>
                <span style={{ color: "oklch(0.52 0.05 60)" }}>Fuel Economy</span>
                <span className="font-semibold" style={{ color: "oklch(0.78 0.18 80)" }}>{isCanada ? "L per 100 km" : "Miles per Gallon"}</span>
                <span style={{ color: "oklch(0.52 0.05 60)" }}>Fuel Volume</span>
                <span className="font-semibold" style={{ color: "oklch(0.78 0.18 80)" }}>{isCanada ? "Litres (L)" : "Gallons (gal)"}</span>
                <span style={{ color: "oklch(0.52 0.05 60)" }}>Currency</span>
                <span className="font-semibold" style={{ color: "oklch(0.78 0.18 80)" }}>{isCanada ? "Canadian Dollar (CAD)" : "US Dollar (USD)"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Fuel Prices ─── */}
        <div className="card-western rounded-xl overflow-hidden">
          {sectionHeader(<Fuel className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />, "Fuel Prices")}
          <div className="p-4 space-y-3">
            <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
              Fuel station prices are sourced from Google Places along your route. Prices shown are estimates — always check the pump for current pricing.
            </p>
            <div className="rounded-lg p-3" style={{ background: "oklch(0.20 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
              <p className="text-xs font-bold" style={{ color: "oklch(0.78 0.18 80)" }}>How fuel cost is estimated</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.05 60)" }}>
                {isCanada
                  ? "Enter your vehicle's fuel consumption (L/100km) and a fuel price ($/L) in the Trip Planner on the Map tab. The app calculates: Distance ÷ 100 × L/100km × $/L."
                  : "Enter your vehicle's MPG and a fuel price ($/gal) in the Trip Planner on the Map tab. The app calculates: Distance ÷ MPG × $/gal."}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Notifications ─── */}
        <div className="card-western rounded-xl overflow-hidden">
          {sectionHeader(<Bell className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />, "Notifications")}
          {prefsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Entry Deadline Reminders</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Get notified before entry deadlines</p>
                </div>
                <Switch checked={enableDeadline} onCheckedChange={setEnableDeadline} />
              </div>
              {enableDeadline && (
                <div>
                  <Label className="text-xs font-medium">Days before deadline to notify</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="number" min={1} max={60} value={daysBefore} onChange={(e) => setDaysBefore(parseInt(e.target.value) || 14)} className="w-24" />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={updatePrefs.isPending}>
                  {updatePrefs.isPending ? "Saving…" : "Save Settings"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => checkDeadlines.mutate()} disabled={checkDeadlines.isPending}>
                  {checkDeadlines.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  Check Now
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ─── About ─── */}
        <div className="card-western rounded-xl overflow-hidden">
          {sectionHeader(<Shield className="w-4 h-4" style={{ color: "oklch(0.72 0.16 75)" }} />, "About")}
          <div className="p-4 space-y-2">
            {[
              ["App", "Rodeo Companion"],
              ["Version", "1.0.0"],
              ["Disciplines", "8 events supported"],
              ["Coverage", "USA & Canada (North America)"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full gap-2"
          style={{ color: "oklch(0.65 0.18 25)", borderColor: "oklch(0.65 0.18 25 / 30%)" }}
          onClick={() => { if (confirm("Sign out of Rodeo Companion?")) logout(); }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
