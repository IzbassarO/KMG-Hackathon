import { cn } from "@/lib/utils";

export function KmgLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl gradient-navy text-white shadow-elevated">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M5 19 L12 4 L19 19 Z" strokeLinejoin="round" />
          <path d="M9 19 L12 11 L15 19" strokeLinejoin="round" />
          <circle cx="12" cy="20" r="0.5" fill="currentColor" />
        </svg>
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-kmg-gold shadow" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-semibold tracking-tight text-kmg-ink">
            KMG Onboarding
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-kmg-navy/70">
            Talent Portal
          </div>
        </div>
      )}
    </div>
  );
}
