import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Video, Trash2, Play, Upload, Timer, Star, ChevronRight, Filter, Pencil, X } from "lucide-react";
import {
  DISCIPLINES,
  DISCIPLINE_LABELS,
  DISCIPLINE_ICONS,
  DISCIPLINE_COLORS,
  type Discipline,
  isTimedDiscipline,
  isScoredDiscipline,
  formatTime,
  formatScore,
} from "@/lib/disciplines";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SUGGESTED_ROUNDS = ["Day 1", "Day 2", "Short Go", "Finals", "Slack"] as const;

// ─── Run Card ─────────────────────────────────────────────────────────────────
function RunCard({
  run,
  onDelete,
  onVideoUpload,
  onEdit,
  rodeoName,
}: {
  run: any;
  onDelete: () => void;
  onVideoUpload: () => void;
  onEdit: () => void;
  rodeoName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: videos } = trpc.videos.listByPerformance.useQuery({ performanceId: run.id });
  const deleteVideo = trpc.videos.delete.useMutation({
    onSuccess: () => trpc.useUtils().videos.listByPerformance.invalidate({ performanceId: run.id }),
  });
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  const discipline = run.discipline as Discipline;
  const colors = DISCIPLINE_COLORS[discipline] ?? DISCIPLINE_COLORS["barrel_racing"];
  const isTimed = isTimedDiscipline(discipline);
  const isScored = isScoredDiscipline(discipline);
  const total = isTimed ? (run.timeSeconds ?? 0) + (run.penaltySeconds ?? 0) : null;

  return (
    <>
      <div className="card-shimmer rounded-xl overflow-hidden" style={{ borderColor: `${colors.accent}40` }}>
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }} />
        <button className="w-full text-left p-3" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <div className={cn("icon-badge text-xl", colors.bg)}>
              {DISCIPLINE_ICONS[discipline] ?? "🏇"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: "oklch(0.93 0.03 75)", fontFamily: "'Playfair Display', serif" }}>
                {DISCIPLINE_LABELS[discipline] ?? discipline}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
                  {format(new Date(run.runDate), "MMM d, yyyy")}
                </p>
                {run.round && run.round !== "Round 1" && (
                  <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: "oklch(0.65 0.14 195 / 20%)", color: "oklch(0.65 0.14 195)" }}>
                    {run.round}
                  </span>
                )}
                {rodeoName && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full truncate max-w-[120px]"
                    style={{ background: "oklch(0.72 0.16 75 / 10%)", color: "oklch(0.72 0.16 75 / 70%)" }}>
                    {rodeoName}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {isTimed && total != null && total > 0 && (
                <p className="text-lg font-black num-gold">
                  {formatTime(total)}
                </p>
              )}
              {isScored && run.score != null && (
                <p className="text-lg font-black num-gold">
                  {formatScore(run.score)}
                </p>
              )}
              {isTimed && (run.penaltySeconds ?? 0) > 0 && (
                <p className="text-xs font-semibold" style={{ color: "oklch(0.65 0.18 25)" }}>+{run.penaltySeconds}s pen.</p>
              )}
              {(run.prizeMoneyCents ?? 0) > 0 && (
                <p className="text-xs font-bold" style={{ color: "oklch(0.65 0.14 145)" }}>💰 ${(run.prizeMoneyCents / 100).toFixed(0)}</p>
              )}
            </div>
            <ChevronRight className={cn("w-4 h-4 transition-transform flex-shrink-0", expanded && "rotate-90")} style={{ color: "oklch(0.52 0.05 60)" }} />
          </div>
        </button>

        {expanded && (
          <div className="px-3 pb-3 space-y-2" style={{ borderTop: "1px solid oklch(0.28 0.06 50)" }}>
            {run.notes && (
              <p className="text-xs pt-2" style={{ color: "oklch(0.62 0.05 65)" }}>{run.notes}</p>
            )}

            {/* Videos */}
            {videos && videos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {videos.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.20 0.05 48)" }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.72 0.16 75 / 20%)" }}>
                      <Play className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.16 75)" }} />
                    </div>
                    <button
                      onClick={() => setPlayUrl(v.url)}
                      className="flex-1 text-xs text-left truncate hover:underline"
                      style={{ color: "oklch(0.72 0.16 75)" }}
                    >
                      {v.filename || "Run Video"}
                    </button>
                    <button onClick={() => deleteVideo.mutate({ id: v.id })} className="p-1">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.20 25)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 text-xs h-7 px-2">
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onVideoUpload} className="flex-1 gap-1.5 text-xs h-7">
                <Upload className="w-3.5 h-3.5" /> Add Video
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.20 25)" }} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Video playback dialog */}
      <Dialog open={!!playUrl} onOpenChange={() => setPlayUrl(null)}>
        <DialogContent className="max-w-sm" style={{ background: "oklch(0.18 0.04 48)" }}>
          <DialogHeader><DialogTitle style={{ color: "oklch(0.78 0.18 80)" }}>Run Video</DialogTitle></DialogHeader>
          {playUrl && <video src={playUrl} controls className="w-full rounded-lg" style={{ maxHeight: "60vh" }} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Add/Edit Run Dialog ──────────────────────────────────────────────────────
function RunDialog({
  open,
  onClose,
  rodeoId,
  availableDisciplines,
  existingRun,
}: {
  open: boolean;
  onClose: () => void;
  rodeoId: number;
  availableDisciplines: Discipline[];
  existingRun?: any;
}) {
  const utils = trpc.useUtils();
  const isEditing = !!existingRun;

  const [discipline, setDiscipline] = useState<Discipline>(
    existingRun?.discipline ?? availableDisciplines[0] ?? "barrel_racing"
  );
  const existingRound = existingRun?.round ?? "Day 1";
  const isCustomDefault = !SUGGESTED_ROUNDS.includes(existingRound as any) && existingRound !== "";
  const [round, setRound] = useState(existingRound);
  const [customRound, setCustomRound] = useState(isCustomDefault ? existingRound : "");
  const [useCustomRound, setUseCustomRound] = useState(isCustomDefault);
  const [timeInput, setTimeInput] = useState(existingRun?.timeSeconds != null ? String(existingRun.timeSeconds) : "");
  const [penaltyInput, setPenaltyInput] = useState(existingRun?.penaltySeconds != null ? String(existingRun.penaltySeconds) : "0");
  const [scoreInput, setScoreInput] = useState(existingRun?.score != null ? String(existingRun.score) : "");
  const [prizeMoney, setPrizeMoney] = useState(existingRun?.prizeMoneyCents != null ? String((existingRun.prizeMoneyCents / 100).toFixed(2)) : "0");
  const [notes, setNotes] = useState(existingRun?.notes ?? "");
  const [runDate, setRunDate] = useState(
    existingRun?.runDate
      ? new Date(existingRun.runDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isTimed = isTimedDiscipline(discipline);
  const isScored = isScoredDiscipline(discipline);

  const uploadVideo = async (performanceId: number, file: File) => {
    const fd = new FormData();
    fd.append("video", file);
    fd.append("performanceId", String(performanceId));
    const res = await fetch("/api/upload/video", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}): ${errText}`);
    }
  };

  const createRun = trpc.performances.create.useMutation({
    onSuccess: async (data: any) => {
      const performanceId = data?.id ?? data?.insertId;
      if (videoFile && performanceId) {
        setUploading(true);
        try {
          await uploadVideo(performanceId, videoFile);
          utils.videos.listByPerformance.invalidate({ performanceId });
        } catch (err: any) {
          toast.error(`Run saved but video upload failed: ${err.message}`);
        } finally {
          setUploading(false);
        }
      }
      utils.performances.listByRodeo.invalidate({ rodeoId });
      utils.performances.list.invalidate();
      toast.success("Run logged! 🎉");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRun = trpc.performances.update.useMutation({
    onSuccess: async () => {
      if (videoFile && existingRun?.id) {
        setUploading(true);
        try {
          await uploadVideo(existingRun.id, videoFile);
          utils.videos.listByPerformance.invalidate({ performanceId: existingRun.id });
        } catch (err: any) {
          toast.error(`Run updated but video upload failed: ${err.message}`);
        } finally {
          setUploading(false);
        }
      }
      utils.performances.listByRodeo.invalidate({ rodeoId });
      utils.performances.list.invalidate();
      toast.success("Run updated!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    const timeVal = isTimed ? parseFloat(timeInput) : undefined;
    const scoreVal = isScored ? parseFloat(scoreInput) : undefined;
    const penaltyVal = parseFloat(penaltyInput) || 0;
    const prizeVal = Math.round((parseFloat(prizeMoney) || 0) * 100);

    if (isTimed && timeInput && (isNaN(timeVal!) || timeVal! <= 0)) {
      toast.error("Enter a valid time in seconds (e.g. 13.456)");
      return;
    }
    if (isScored && scoreInput && (isNaN(scoreVal!) || scoreVal! < 0 || scoreVal! > 100)) {
      toast.error("Score must be 0–100");
      return;
    }

    if (isEditing) {
      updateRun.mutate({
        id: existingRun.id,
        discipline,
        round: round || "Day 1",
        timeSeconds: isTimed && timeInput ? timeVal : null,
        score: isScored && scoreInput ? scoreVal : null,
        penaltySeconds: penaltyVal,
        prizeMoneyCents: prizeVal,
        notes: notes || undefined,
        runDate: new Date(runDate).getTime(),
      });
    } else {
      createRun.mutate({
        rodeoId,
        discipline,
        round: round || "Day 1",
        timeSeconds: isTimed && timeInput ? timeVal : undefined,
        score: isScored && scoreInput ? scoreVal : undefined,
        penaltySeconds: penaltyVal,
        prizeMoneyCents: prizeVal,
        notes: notes || undefined,
        runDate: new Date(runDate).getTime(),
      });
    }
  };

  const isPending = createRun.isPending || updateRun.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto max-h-[92vh] overflow-y-auto" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
            {isEditing ? "Edit Run" : "Log a Run"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Discipline */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Discipline</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableDisciplines.map((d) => {
                const c = DISCIPLINE_COLORS[d] ?? DISCIPLINE_COLORS["barrel_racing"];
                const sel = discipline === d;
                return (
                  <button key={d} type="button" onClick={() => setDiscipline(d)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border", sel ? `${c.bg} ${c.text} border-current` : "border-transparent")}
                    style={sel ? {} : { background: "oklch(0.22 0.05 48)", color: "oklch(0.52 0.05 60)", border: "1px solid oklch(0.30 0.06 50)" }}
                  >
                    {DISCIPLINE_ICONS[d] ?? "🏇"} {DISCIPLINE_LABELS[d] ?? d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Round — select with custom fallback */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              Round / Go
            </Label>
            {useCustomRound ? (
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g. Perf 2, Matinee"
                  value={customRound}
                  onChange={(e) => { setCustomRound(e.target.value); setRound(e.target.value); }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-amber-900/40 text-amber-400 hover:bg-amber-900/20 h-9 px-2"
                  onClick={() => { setUseCustomRound(false); setRound("Day 1"); setCustomRound(""); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Select value={round} onValueChange={(v) => {
                if (v === "__custom__") { setUseCustomRound(true); setRound(""); }
                else setRound(v);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTED_ROUNDS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Other...</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Run Date</Label>
            <Input type="date" className="mt-1" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
          </div>

          {/* Time in seconds */}
          {isTimed && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
                  Time <span className="font-normal text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>(seconds, e.g. 13.456)</span>
                </Label>
                <div className="relative mt-1">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "oklch(0.72 0.16 75)" }} />
                  <Input className="pl-9" type="number" step="0.001" min="0" placeholder="13.456" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>Penalty seconds (if any)</Label>
                <Input className="mt-1" type="number" step="0.001" min="0" placeholder="0" value={penaltyInput} onChange={(e) => setPenaltyInput(e.target.value)} />
              </div>
            </div>
          )}

          {/* Score (roughstock) */}
          {isScored && (
            <div>
              <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
                Score <span className="font-normal text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>(0–100 pts)</span>
              </Label>
              <div className="relative mt-1">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "oklch(0.72 0.16 75)" }} />
                <Input className="pl-9" type="number" step="0.5" min="0" max="100" placeholder="82.5" value={scoreInput} onChange={(e) => setScoreInput(e.target.value)} />
              </div>
            </div>
          )}

          {/* Prize Money */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              Prize Money ($) <span className="font-normal text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>(optional)</span>
            </Label>
            <Input className="mt-1" type="number" step="0.01" min="0" placeholder="0.00" value={prizeMoney} onChange={(e) => setPrizeMoney(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>Notes</Label>
            <Input className="mt-1" placeholder="How did the run go?" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Video */}
          <div>
            <Label className="text-xs font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>
              Video <span className="font-normal text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>(optional — stored in cloud)</span>
            </Label>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="mt-1 w-full h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ borderColor: videoFile ? "oklch(0.65 0.14 145)" : "oklch(0.32 0.07 55)", background: videoFile ? "oklch(0.65 0.14 145 / 10%)" : "oklch(0.20 0.05 48)" }}
            >
              <Video className="w-5 h-5" style={{ color: videoFile ? "oklch(0.65 0.14 145)" : "oklch(0.52 0.05 60)" }} />
              <span className="text-xs" style={{ color: videoFile ? "oklch(0.65 0.14 145)" : "oklch(0.52 0.05 60)" }}>
                {videoFile ? videoFile.name : "Tap to attach run video"}
              </span>
            </button>
            {videoFile && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs flex-1" style={{ color: "oklch(0.52 0.05 60)" }}>
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB · Saved to secure cloud storage
                </p>
                <button onClick={() => setVideoFile(null)} className="p-0.5">
                  <X className="w-3.5 h-3.5" style={{ color: "oklch(0.52 0.05 60)" }} />
                </button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} size="sm" className="btn-gold">
            {isPending ? "Saving…" : isEditing ? "✓ Save Changes" : "★ Log Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Video Upload Dialog ──────────────────────────────────────────────────────
function VideoUploadDialog({ open, onClose, performanceId }: { open: boolean; onClose: () => void; performanceId: number }) {
  const utils = trpc.useUtils();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("performanceId", String(performanceId));

      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload/video");
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(fd);
      });

      utils.videos.listByPerformance.invalidate({ performanceId });
      toast.success("Video uploaded! 🎬");
      onClose();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 30%)" }}>
        <DialogHeader><DialogTitle style={{ color: "oklch(0.78 0.18 80)" }}>Upload Run Video</DialogTitle></DialogHeader>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2"
          style={{ borderColor: file ? "oklch(0.65 0.14 145)" : "oklch(0.32 0.07 55)", background: "oklch(0.20 0.05 48)" }}
        >
          <Video className="w-8 h-8" style={{ color: file ? "oklch(0.65 0.14 145)" : "oklch(0.52 0.05 60)" }} />
          <span className="text-sm" style={{ color: file ? "oklch(0.65 0.14 145)" : "oklch(0.52 0.05 60)" }}>
            {file ? file.name : "Tap to select video"}
          </span>
        </button>
        {file && <p className="text-xs text-center" style={{ color: "oklch(0.52 0.05 60)" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>}
        {uploading && progress > 0 && (
          <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "oklch(0.25 0.05 50)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "oklch(0.72 0.16 75)" }} />
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} size="sm" disabled={uploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading} size="sm" className="btn-gold">
            {uploading ? `Uploading ${progress}%…` : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rodeo runs section ───────────────────────────────────────────────────────
function RodeoRunsSection({ rodeo }: { rodeo: any }) {
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [videoTarget, setVideoTarget] = useState<number | null>(null);
  const [editingRun, setEditingRun] = useState<any | null>(null);
  const { data: runs } = trpc.performances.listByRodeo.useQuery({ rodeoId: rodeo.id });
  const deleteRun = trpc.performances.delete.useMutation({
    onSuccess: () => {
      utils.performances.listByRodeo.invalidate({ rodeoId: rodeo.id });
      utils.performances.list.invalidate();
      toast.success("Run deleted");
    },
  });

  let disciplineList: Discipline[] = [];
  try { disciplineList = rodeo.disciplines ? JSON.parse(rodeo.disciplines) : [rodeo.discipline]; }
  catch { disciplineList = [rodeo.discipline]; }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm" style={{ color: "oklch(0.78 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
            {rodeo.name}
          </h3>
          <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
            {format(new Date(rodeo.rodeoDate), "MMM d, yyyy")}
            {rodeo.locationName ? ` · ${rodeo.locationName}` : ""}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {disciplineList.map((d) => {
              const c = DISCIPLINE_COLORS[d] ?? DISCIPLINE_COLORS["barrel_racing"];
              return (
                <span key={d} className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold", c.bg, c.text)}>
                  {DISCIPLINE_ICONS[d] ?? "🏇"} {DISCIPLINE_LABELS[d] ?? d}
                </span>
              );
            })}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="btn-gold h-7 text-xs gap-1 px-3 rounded-full flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> Log Run
        </Button>
      </div>

      {runs && runs.length > 0 ? (
        <div className="space-y-2">
          {runs.map((run: any) => (
            <RunCard
              key={run.id}
              run={run}
              onDelete={() => deleteRun.mutate({ id: run.id })}
              onVideoUpload={() => setVideoTarget(run.id)}
              onEdit={() => setEditingRun(run)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-5 rounded-xl" style={{ background: "oklch(0.18 0.04 48)", border: "1px dashed oklch(0.32 0.07 55)" }}>
          <p className="text-sm" style={{ color: "oklch(0.42 0.04 55)" }}>No runs logged yet</p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.35 0.03 50)" }}>
            Tap "Log Run" to record your {disciplineList.map(d => DISCIPLINE_LABELS[d] ?? d).join(" / ")} run
          </p>
        </div>
      )}

      {showAdd && (
        <RunDialog open={showAdd} onClose={() => setShowAdd(false)} rodeoId={rodeo.id} availableDisciplines={disciplineList} />
      )}
      {editingRun && (
        <RunDialog
          open={true}
          onClose={() => setEditingRun(null)}
          rodeoId={rodeo.id}
          availableDisciplines={disciplineList}
          existingRun={editingRun}
        />
      )}
      {videoTarget !== null && (
        <VideoUploadDialog open={true} onClose={() => setVideoTarget(null)} performanceId={videoTarget} />
      )}
    </div>
  );
}

// ─── All Runs flat view with rich filters ─────────────────────────────────────
function AllRunsView() {
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const [rodeoFilter, setRodeoFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: runs, isLoading } = trpc.performances.list.useQuery();
  const { data: rodeos } = trpc.rodeos.list.useQuery();
  const utils = trpc.useUtils();
  const [videoTarget, setVideoTarget] = useState<number | null>(null);
  const [editingRun, setEditingRun] = useState<any | null>(null);

  const deleteRun = trpc.performances.delete.useMutation({
    onSuccess: () => { utils.performances.list.invalidate(); toast.success("Run deleted"); },
  });

  const rodeoMap = useMemo(
    () => Object.fromEntries((rodeos ?? []).map((r) => [r.id, r])),
    [rodeos]
  );

  // Collect unique provinces from rodeos
  const provinces = useMemo(() => {
    const set = new Set<string>();
    (rodeos ?? []).forEach((r) => { if (r.countryCode) set.add(r.countryCode); });
    return Array.from(set).sort();
  }, [rodeos]);

  const filtered = useMemo(() => {
    let list = (runs ?? []) as any[];

    // Sort soonest first (earliest runDate at top)
    list = [...list].sort((a, b) => new Date(a.runDate).getTime() - new Date(b.runDate).getTime());

    if (disciplineFilter !== "all") list = list.filter((r) => r.discipline === disciplineFilter);
    if (rodeoFilter !== "all") list = list.filter((r) => String(r.rodeoId) === rodeoFilter);
    if (dateFrom) list = list.filter((r) => new Date(r.runDate) >= new Date(dateFrom));
    if (dateTo) list = list.filter((r) => new Date(r.runDate) <= new Date(dateTo + "T23:59:59"));
    if (provinceFilter !== "all") {
      list = list.filter((r) => {
        const rodeo = rodeoMap[r.rodeoId];
        return rodeo?.countryCode === provinceFilter || rodeo?.locationAddress?.includes(provinceFilter);
      });
    }

    return list;
  }, [runs, disciplineFilter, rodeoFilter, dateFrom, dateTo, provinceFilter, rodeoMap]);

  const activeFilterCount = [
    disciplineFilter !== "all",
    rodeoFilter !== "all",
    !!dateFrom,
    !!dateTo,
    provinceFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters((v) => !v)}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: "oklch(0.62 0.05 65)" }}
      >
        <Filter className="w-4 h-4" />
        {showFilters ? "Hide Filters" : "Show Filters"}
        {activeFilterCount > 0 && (
          <span className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            style={{ background: "oklch(0.72 0.16 75)", color: "oklch(0.15 0.04 48)" }}>
            {activeFilterCount}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="rounded-xl p-3 space-y-3" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.30 0.06 50)" }}>
          {/* Discipline filter */}
          <div>
            <Label className="text-xs font-semibold mb-1 block" style={{ color: "oklch(0.72 0.16 75)" }}>Discipline</Label>
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="All disciplines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Disciplines</SelectItem>
                {DISCIPLINES.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">{DISCIPLINE_ICONS[d] ?? "🏇"} {DISCIPLINE_LABELS[d] ?? d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rodeo filter */}
          <div>
            <Label className="text-xs font-semibold mb-1 block" style={{ color: "oklch(0.72 0.16 75)" }}>Rodeo</Label>
            <Select value={rodeoFilter} onValueChange={setRodeoFilter}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="All rodeos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Rodeos</SelectItem>
                {(rodeos ?? []).map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} className="text-xs">{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-semibold mb-1 block" style={{ color: "oklch(0.72 0.16 75)" }}>From Date</Label>
              <Input type="date" className="text-xs h-8" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block" style={{ color: "oklch(0.72 0.16 75)" }}>To Date</Label>
              <Input type="date" className="text-xs h-8" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {/* Province filter */}
          {provinces.length > 0 && (
            <div>
              <Label className="text-xs font-semibold mb-1 block" style={{ color: "oklch(0.72 0.16 75)" }}>Province / Region</Label>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="All provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Provinces</SelectItem>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7"
              onClick={() => {
                setDisciplineFilter("all");
                setRodeoFilter("all");
                setDateFrom("");
                setDateTo("");
                setProvinceFilter("all");
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🏇</div>
          <p className="font-semibold" style={{ color: "oklch(0.78 0.18 80)" }}>No runs yet</p>
          <p className="text-sm mt-1" style={{ color: "oklch(0.52 0.05 60)" }}>Log runs from the By Rodeo tab</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "oklch(0.52 0.05 60)" }}>
            {filtered.length} run{filtered.length !== 1 ? "s" : ""} · sorted by date
          </p>
          {filtered.map((run: any) => {
            const rodeo = rodeoMap[run.rodeoId];
            let disciplineList: Discipline[] = [];
            try { disciplineList = rodeo?.disciplines ? JSON.parse(rodeo.disciplines) : [rodeo?.discipline ?? run.discipline]; }
            catch { disciplineList = [run.discipline]; }
            return (
              <RunCard
                key={run.id}
                run={run}
                onDelete={() => deleteRun.mutate({ id: run.id })}
                onVideoUpload={() => setVideoTarget(run.id)}
                onEdit={() => setEditingRun({ run, rodeo, disciplineList })}
                rodeoName={rodeo?.name}
              />
            );
          })}
        </div>
      )}

      {videoTarget !== null && (
        <VideoUploadDialog open={true} onClose={() => setVideoTarget(null)} performanceId={videoTarget} />
      )}
      {editingRun && (
        <RunDialog
          open={true}
          onClose={() => setEditingRun(null)}
          rodeoId={editingRun.run.rodeoId}
          availableDisciplines={editingRun.disciplineList}
          existingRun={editingRun.run}
        />
      )}
    </div>
  );
}

// ─── Main Performance Page ────────────────────────────────────────────────────
export default function Performance() {
  const { data: rodeos, isLoading } = trpc.rodeos.list.useQuery();
  const now = new Date();
  // Sort rodeos: upcoming soonest first, past most recent first
  const upcoming = (rodeos ?? [])
    .filter((r) => new Date(r.rodeoDate) >= now)
    .sort((a, b) => new Date(a.rodeoDate).getTime() - new Date(b.rodeoDate).getTime());
  const past = (rodeos ?? [])
    .filter((r) => new Date(r.rodeoDate) < now)
    .sort((a, b) => new Date(b.rodeoDate).getTime() - new Date(a.rodeoDate).getTime());

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* ── Flashy Hero Header ── */}
      <div className="hero-western relative px-4 pt-10 pb-6">
        {/* Decorative */}
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">🏆</div>
        <div className="absolute top-8 right-14 text-sm opacity-10 select-none pointer-events-none">✦</div>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>✦ Performance ✦</p>
          <h1 className="text-3xl font-black leading-none mb-1"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
            My Runs
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>Times, scores &amp; videos per discipline</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Tabs defaultValue="by-rodeo">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="by-rodeo" className="flex-1 text-xs">By Rodeo</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs">All Runs</TabsTrigger>
          </TabsList>

          <TabsContent value="by-rodeo">
            {isLoading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: "oklch(0.20 0.05 48)" }} />)}</div>
            ) : !rodeos?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>No rodeos scheduled</h3>
                <p className="text-sm" style={{ color: "oklch(0.52 0.05 60)" }}>Add a rodeo in the Schedule tab first.</p>
              </div>
            ) : (
              <Tabs defaultValue="upcoming-r">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="upcoming-r" className="flex-1 text-xs">Upcoming ({upcoming.length})</TabsTrigger>
                  <TabsTrigger value="past-r" className="flex-1 text-xs">Past ({past.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming-r">
                  {upcoming.length === 0
                    ? <p className="text-center text-sm py-8" style={{ color: "oklch(0.52 0.05 60)" }}>No upcoming rodeos</p>
                    : upcoming.map((r) => <RodeoRunsSection key={r.id} rodeo={r} />)}
                </TabsContent>
                <TabsContent value="past-r">
                  {past.length === 0
                    ? <p className="text-center text-sm py-8" style={{ color: "oklch(0.52 0.05 60)" }}>No past rodeos</p>
                    : past.map((r) => <RodeoRunsSection key={r.id} rodeo={r} />)}
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="all">
            <AllRunsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
