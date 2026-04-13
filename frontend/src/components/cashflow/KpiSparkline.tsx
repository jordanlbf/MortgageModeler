"use client";

interface Props {
  data: number[];
  color: string;
  selectedIndex?: number;
  width?: number;
  height?: number;
}

export default function KpiSparkline({
  data, color, selectedIndex = 0, width = 100, height = 24,
}: Props) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 6) + 3;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const clampedIdx = Math.max(0, Math.min(selectedIndex, points.length - 1));
  const allPts = points.map(p => `${p[0]},${p[1]}`).join(" ");
  const activePts = points.slice(0, clampedIdx + 1).map(p => `${p[0]},${p[1]}`).join(" ");
  const [sx, sy] = points[clampedIdx];

  return (
    <div className="cf-kpi-sparkline">
      <svg
        width={width}
        height={height}
        overflow="visible"
        style={{ display: "block" }}
      >
        {/* Full trajectory — faded */}
        <polyline
          points={allPts}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
        />
        {/* Active segment — bright */}
        <polyline
          points={activePts}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={1}
        />
        {/* Position dot */}
        <circle cx={sx} cy={sy} r={1.5} fill={color} />
      </svg>
    </div>
  );
}