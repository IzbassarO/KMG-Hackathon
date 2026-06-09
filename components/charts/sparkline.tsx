"use client";

export function Sparkline({
  values,
  width = 240,
  height = 60,
  color = "#003F7D",
  fill = "rgba(0, 63, 125, 0.15)"
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return { x, y };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={area} fill={fill} />
      <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3 : 0}
          fill={color}
        />
      ))}
    </svg>
  );
}
