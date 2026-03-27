import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, User, LogOut, ChevronRight, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { user, logout } = useAuth();
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

  const [enableDeadline, setEnableDeadline] = useState(true);
  const [daysBefore, setDaysBefore] = useState(14);

  useEffect(() => {
    if (prefs) {
      setEnableDeadline(prefs.enableEntryDeadline ?? true);
      setDaysBefore(prefs.defaultDaysBefore ?? 14);
    }
  }, [prefs]);

  const handleSave = () => {
    updatePrefs.mutate({
      enableEntryDeadline: enableDeadline,
      defaultDaysBefore: daysBefore,
    });
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            ⚙️ Settings
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{user?.name ?? "Rodeo Competitor"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Notification settings */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          </div>

          {prefsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Entry Deadline Reminders</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Get notified before entry deadlines</p>
                </div>
                <Switch
                  checked={enableDeadline}
                  onCheckedChange={setEnableDeadline}
                />
              </div>

              {enableDeadline && (
                <div>
                  <Label className="text-xs font-medium">Default days before deadline to notify</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={daysBefore}
                      onChange={(e) => setDaysBefore(parseInt(e.target.value) || 14)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={updatePrefs.isPending}>
                  {updatePrefs.isPending ? "Saving…" : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkDeadlines.mutate()}
                  disabled={checkDeadlines.isPending}
                >
                  {checkDeadlines.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  Check Now
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">About</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">App</span>
              <span className="font-medium text-foreground">Rodeo Companion</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Disciplines</span>
              <span className="font-medium text-foreground">7 events supported</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => {
            if (confirm("Sign out of Rodeo Companion?")) logout();
          }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
