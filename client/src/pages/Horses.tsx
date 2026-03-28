import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Star } from "lucide-react";
import {
  DISCIPLINES, DISCIPLINE_LABELS, DISCIPLINE_IMAGES, DISCIPLINE_ICONS, DISCIPLINE_COLORS,
  type Discipline,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Discipline chip for horse form ──────────────────────────────────────────
function DisciplineChip({ discipline, selected, onToggle }: { discipline: Discipline; selected: boolean; onToggle: () => void }) {
  const colors = DISCIPLINE_COLORS[discipline];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold transition-all border-2 w-[80px]",
        selected ? "shadow-lg scale-105" : "border-transparent hover:scale-102"
      )}
      style={selected
        ? { background: colors.bg.replace("bg-", ""), borderColor: colors.accent, color: colors.accent }
        : { background: "oklch(0.22 0.05 48)", color: "oklch(0.52 0.05 60)", border: "1px solid oklch(0.30 0.06 50)" }
      }
    >
      <img
        src={DISCIPLINE_IMAGES[discipline]}
        alt={DISCIPLINE_LABELS[discipline]}
        className="w-12 h-12 object-cover rounded-lg"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <span className="text-center leading-tight text-[10px]">{DISCIPLINE_LABELS[discipline]}</span>
    </button>
  );
}

// ─── Horse Card ───────────────────────────────────────────────────────────────
function HorseCard({ horse, onEdit, onDelete }: {
  horse: { id: number; name: string; disciplines: string | null; breed: string | null; color: string | null; age: number | null; notes: string | null };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const disciplines: Discipline[] = horse.disciplines ? JSON.parse(horse.disciplines) : [];
  return (
    <div className="rounded-xl overflow-hidden shimmer-card" style={{ border: "1px solid oklch(0.30 0.08 55)" }}>
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, oklch(0.72 0.18 75), oklch(0.65 0.20 50), oklch(0.72 0.18 75))" }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "oklch(0.25 0.08 55)", border: "2px solid oklch(0.72 0.18 75)" }}>
              🐴
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.88 0.12 75)" }}>
                {horse.name}
              </h3>
              <div className="flex gap-2 text-xs flex-wrap" style={{ color: "oklch(0.52 0.05 60)" }}>
                {horse.breed && <span>{horse.breed}</span>}
                {horse.color && <span>· {horse.color}</span>}
                {horse.age != null && <span>· {horse.age} yrs</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: "oklch(0.72 0.16 75)" }}>
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20" style={{ color: "oklch(0.65 0.18 25)" }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disciplines */}
        {disciplines.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {disciplines.map((d) => (
              <div key={d} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "oklch(0.25 0.08 55)", color: "oklch(0.78 0.18 80)" }}>
                <img src={DISCIPLINE_IMAGES[d]} alt={DISCIPLINE_LABELS[d]} className="w-4 h-4 rounded object-cover" />
                {DISCIPLINE_LABELS[d]}
              </div>
            ))}
          </div>
        )}

        {horse.notes && (
          <p className="text-xs mt-2 italic" style={{ color: "oklch(0.52 0.05 60)" }}>{horse.notes}</p>
        )}
      </div>
    </div>
  );
}

// ─── Horse Form Dialog ────────────────────────────────────────────────────────
function HorseDialog({ open, onClose, editHorse }: {
  open: boolean;
  onClose: () => void;
  editHorse?: { id: number; name: string; disciplines: string | null; breed: string | null; color: string | null; age: number | null; notes: string | null } | null;
}) {
  const utils = trpc.useUtils();
  const createMutation = trpc.horses.create.useMutation({
    onSuccess: () => { utils.horses.list.invalidate(); toast.success("Horse added! 🐴"); onClose(); },
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

  const toggleDiscipline = (d: Discipline) => {
    setSelectedDisciplines((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Horse name is required"); return; }
    const payload = {
      name: name.trim(),
      disciplines: selectedDisciplines,
      breed: breed.trim() || undefined,
      color: color.trim() || undefined,
      age: age ? parseInt(age) : undefined,
      notes: notes.trim() || undefined,
    };
    if (editHorse) {
      updateMutation.mutate({ id: editHorse.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" style={{ background: "oklch(0.18 0.05 48)", border: "1px solid oklch(0.30 0.08 55)", color: "oklch(0.93 0.03 75)" }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.88 0.12 75)" }}>
            {editHorse ? "Edit Horse" : "Add a Horse 🐴"}
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
              {DISCIPLINES.map((d) => (
                <DisciplineChip key={d} discipline={d} selected={selectedDisciplines.includes(d)} onToggle={() => toggleDiscipline(d)} />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
            <Input className="mt-1" placeholder="Any notes about this horse..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button className="btn-gold" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : editHorse ? "Update Horse" : "Add Horse"}
          </Button>
        </DialogFooter>
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
      <div className="animate-spin text-4xl">🐴</div>
    </div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "oklch(0.13 0.04 48)" }}>
        <div className="text-5xl">🐴</div>
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
            <span className="text-2xl">🐴</span>
            <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.72 0.18 75 / 20%)", color: "oklch(0.72 0.18 75)", border: "1px solid oklch(0.72 0.18 75 / 40%)" }}>
              My Horses
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.08 75)" }}>
            Horse Roster
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>
            {horses?.length ?? 0} horse{(horses?.length ?? 0) !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 75), transparent)" }} />
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Add button */}
        <Button className="btn-gold w-full gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add a Horse
        </Button>

        {/* Horse list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />
            ))}
          </div>
        ) : horses?.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-6xl">🐴</div>
            <p className="font-semibold" style={{ color: "oklch(0.62 0.05 65)" }}>No horses yet</p>
            <p className="text-sm" style={{ color: "oklch(0.42 0.04 55)" }}>Add your horses and assign them to disciplines</p>
          </div>
        ) : (
          <div className="space-y-3">
            {horses?.map((horse) => (
              <HorseCard
                key={horse.id}
                horse={horse}
                onEdit={() => setEditHorse(horse as any)}
                onDelete={() => deleteHorse.mutate({ id: horse.id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <HorseDialog open={showAdd || !!editHorse} onClose={() => { setShowAdd(false); setEditHorse(null); }} editHorse={editHorse as any} />
    </div>
  );
}
