"use client";

export interface BarDatum {
  label: string;
  value: number;
  secondary?: number;
}

export function BarChart({
  data,
  height = 200,
  primaryColor = "#003F7D",
  secondaryColor = "#F39200"
}: {
  data: BarDatum[];
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d) => {
          const primary = (d.value / max) * (height - 30);
          const secondary = d.secondary ? (d.secondary / max) * (height - 30) : 0;
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div className="flex items-end gap-1">
                <div
                  className="w-5 rounded-t-md transition-all"
                  style={{ height: primary, background: primaryColor }}
                  title={`${d.label}: ${d.value}`}
                />
                {d.secondary !== undefined && (
                  <div
                    className="w-5 rounded-t-md transition-all"
                    style={{ height: secondary, background: secondaryColor }}
                    title={`${d.label}: ${d.secondary}`}
                  />
                )}
              </div>
              <div className="text-xs font-semibold text-kmg-ink">{d.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
