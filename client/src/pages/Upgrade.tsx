import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Check, Loader2 } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited rodeos",
  "Unlimited run logs",
  "Unlimited horses",
  "Season analytics & reports",
  "Priority support",
] as const;

export default function Upgrade() {
  const [, navigate] = useLocation();
  const { data: usage, isLoading } = trpc.plan.usage.useQuery();

  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="hero-western relative px-4 pt-10 pb-6">
        <div className="absolute top-4 right-6 text-2xl opacity-15 select-none pointer-events-none">
          <Crown className="w-8 h-8" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.16 75 / 50%), transparent)" }} />
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1 as unknown as string)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.72 0.16 75 / 15%)", color: "oklch(0.78 0.18 80)" }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1"
            style={{ color: "oklch(0.72 0.16 75 / 60%)" }}>Upgrade</p>
          <h1 className="text-3xl font-black leading-none mb-1"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)", textShadow: "0 0 30px oklch(0.72 0.16 75 / 50%)" }}>
            Go Pro
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.62 0.05 65)" }}>Unlock the full Rodeo Companion experience</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Current usage */}
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.72 0.16 75)" }} /></div>
        ) : usage && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.05 60)" }}>
              Your Usage ({usage.plan === "pro" ? "Pro" : "Free Plan"})
            </p>
            {[
              { label: "Rodeos", used: usage.rodeoCount, max: usage.limits.maxRodeos },
              { label: "Runs", used: usage.performanceCount, max: usage.limits.maxPerformances },
              { label: "Horses", used: usage.horseCount, max: usage.limits.maxHorses },
            ].map((item) => {
              const pct = usage.plan === "pro" ? 0 : Math.min(100, (item.used / item.max) * 100);
              const atLimit = usage.plan === "free" && item.used >= item.max;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "oklch(0.72 0.08 65)" }}>{item.label}</span>
                    <span className="text-xs font-bold" style={{ color: atLimit ? "oklch(0.65 0.18 25)" : "oklch(0.78 0.18 80)" }}>
                      {item.used}{usage.plan === "free" ? ` / ${item.max}` : ""}
                    </span>
                  </div>
                  {usage.plan === "free" && (
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.28 0.06 50)" }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${pct}%`,
                        background: atLimit ? "oklch(0.65 0.18 25)" : "oklch(0.72 0.16 75)",
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pro plan card */}
        <div className="rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, oklch(0.22 0.08 55), oklch(0.18 0.06 50))",
            border: "2px solid oklch(0.72 0.16 75)",
            boxShadow: "0 0 30px oklch(0.72 0.16 75 / 25%)",
          }}>
          <div className="p-5 text-center">
            <Crown className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.78 0.18 80)" }} />
            <h2 className="text-2xl font-black mb-1"
              style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.93 0.03 75)" }}>
              Rodeo Companion Pro
            </h2>
            <p className="text-sm mb-4" style={{ color: "oklch(0.62 0.05 65)" }}>
              Everything you need for the full season
            </p>
            <div className="space-y-2 text-left max-w-xs mx-auto mb-5">
              {PRO_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.14 145)" }} />
                  <span className="text-sm" style={{ color: "oklch(0.88 0.03 70)" }}>{feature}</span>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full rounded-xl text-base font-bold py-3"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.16 75), oklch(0.62 0.18 65))",
                color: "oklch(0.12 0.04 45)",
                boxShadow: "0 4px 20px oklch(0.72 0.16 75 / 40%)",
              }}
              onClick={() => {
                // Placeholder — no payment processing yet
                alert("Pro subscriptions coming soon! Contact us for early access.");
              }}
            >
              Upgrade to Pro — Coming Soon
            </Button>
            <p className="text-xs mt-3" style={{ color: "oklch(0.42 0.04 55)" }}>
              Payment processing is not yet available. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
