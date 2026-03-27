import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trophy, Video, Upload, Play, Trash2, Clock, Star, ChevronRight, Filter } from "lucide-react";
import { format } from "date-fns";
import {
  DISCIPLINES, DISCIPLINE_LABELS, DISCIPLINE_ICONS, DISCIPLINE_COLORS,
  isTimedDiscipline, formatTime, formatScore, type Discipline,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";

function VideoUploadButton({ performanceId }: { performanceId: number }) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) { toast.error("File too large (max 500 MB)"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("performanceId", String(performanceId));
      const res = await fetch("/api/upload/video", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      utils.videos.listByPerformance.invalidate({ performanceId });
      toast.success("Video uploaded!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
        <Upload className="w-3.5 h-3.5" />
        {uploading ? "Uploading…" : "Upload Video"}
      </Button>
    </>
  );
}

function VideoList({ performanceId }: { performanceId: number }) {
  const utils = trpc.useUtils();
  const { data: vids } = trpc.videos.listByPerformance.useQuery({ performanceId });
  const deleteMutation = trpc.videos.delete.useMutation({
    onSuccess: () => utils.videos.listByPerformance.invalidate({ performanceId }),
  });
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  if (!vids?.length) return null;

  return (
    <>
      <div className="mt-2 space-y-1.5">
        {vids.map((v) => (
          <div key={v.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
            <Video className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs text-foreground flex-1 truncate">{v.filename ?? "Video"}</span>
            <button onClick={() => setPlayUrl(v.url)} className="text-primary hover:text-primary/80 transition-colors">
              <Play className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => deleteMutation.mutate({ id: v.id })} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Dialog open={!!playUrl} onOpenChange={() => setPlayUrl(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Run Video</DialogTitle></DialogHeader>
          {playUrl && (
            <video src={playUrl} controls className="w-full rounded-lg" style={{ maxHeight: "60vh" }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RunCard({ run, rodeoName }: { run: any; rodeoName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isTimed = isTimedDiscipline(run.discipline as Discipline);
  const total = isTimed ? (run.timeSeconds ?? 0) + (run.penaltySeconds ?? 0) : null;
  const colors = DISCIPLINE_COLORS[run.discipline as Discipline];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button className="w-full text-left p-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0", colors.bg)}>
            {DISCIPLINE_ICONS[run.discipline as Discipline]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {isTimed ? formatTime(total) : formatScore(run.score)}
              </span>
              {isTimed && (run.penaltySeconds ?? 0) > 0 && (
                <span className="text-xs text-orange-600">(+{run.penaltySeconds}s)</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {DISCIPLINE_LABELS[run.discipline as Discipline]} · {format(new Date(run.runDate), "MMM d, yyyy")}
            </p>
            {rodeoName && <p className="text-xs text-muted-foreground truncate">{rodeoName}</p>}
          </div>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border pt-2.5 space-y-2">
          {run.notes && <p className="text-xs text-muted-foreground">{run.notes}</p>}
          <div className="flex items-center gap-2">
            <VideoUploadButton performanceId={run.id} />
          </div>
          <VideoList performanceId={run.id} />
        </div>
      )}
    </div>
  );
}

export default function Performance() {
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const { data: runs, isLoading } = trpc.performances.list.useQuery();
  const { data: rodeos } = trpc.rodeos.list.useQuery();

  const rodeoMap = Object.fromEntries((rodeos ?? []).map((r) => [r.id, r.name]));

  const filtered = runs?.filter((r) =>
    disciplineFilter === "all" || r.discipline === disciplineFilter
  ) ?? [];

  // Stats
  const timedRuns = filtered.filter((r) => r.timeSeconds != null);
  const times = timedRuns.map((r) => (r.timeSeconds ?? 0) + (r.penaltySeconds ?? 0));
  const bestTime = times.length ? Math.min(...times) : null;

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            🏆 My Runs
          </h1>
          <p className="text-xs text-muted-foreground">{filtered.length} run{filtered.length !== 1 ? "s" : ""} recorded</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Stats row */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Runs</p>
              <p className="text-xl font-bold text-foreground">{filtered.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Best Time</p>
              <p className="text-xl font-bold text-primary">{bestTime != null ? formatTime(bestTime) : "—"}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Rodeos</p>
              <p className="text-xl font-bold text-foreground">{new Set(filtered.map((r) => r.rodeoId)).size}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="text-xs flex-1">
              <SelectValue placeholder="All disciplines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Disciplines</SelectItem>
              {DISCIPLINES.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {DISCIPLINE_ICONS[d]} {DISCIPLINE_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Run list */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🏇</div>
            <h3 className="font-semibold text-foreground mb-2">No runs yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Log runs from the Schedule page by opening a rodeo and tapping "Log Run".
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((run) => (
              <RunCard key={run.id} run={run} rodeoName={rodeoMap[run.rodeoId]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
