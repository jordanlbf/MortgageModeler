"use client";

import { memo } from "react";

interface Props {
  data: number[];
  color: string;
  colors?: string[];
  selectedIndex?: number;
  stepped?: boolean;
  width?: number;
  height?: number;
}

export default memo(function KpiSparkline({
  data, color, colors, selectedIndex = 0, stepped = false, width = 100, height = 24,
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
  const [sx, sy] = points[clampedIdx];

  // Per-segment colored stepped rendering
  if (stepped && colors) {
    // Build segments grouped by color
    const segments: { color: string; path: string; startIdx: number; endIdx: number }[] = [];
    let segStart = 0;
    for (let i = 1; i <= points.length; i++) {
      if (i === points.length || colors[i] !== colors[segStart]) {
        const pts = points.slice(segStart, i);
        let d = `M${pts[0][0]},${pts[0][1]}`;
        for (let j = 1; j < pts.length; j++) {
          d += ` H${pts[j][0]} V${pts[j][1]}`;
        }
        // Extend last point to the next point's x if there is one
        if (i < points.length) {
          d += ` H${points[i][0]}`;
        }
        segments.push({ color: colors[segStart], path: d, startIdx: segStart, endIdx: i - 1 });
        segStart = i;
      }
    }

    return (
      <div className="cf-kpi-sparkline">
        <svg width={width} height={height} overflow="visible" style={{ display: "block" }}>
          {segments.map((seg, i) => (
            <g key={i}>
              <path d={seg.path} fill="none" stroke={seg.color} strokeWidth={1} opacity={0.15} />
              {clampedIdx >= seg.startIdx && (
                <path
                  d={(() => {
                    const end = Math.min(clampedIdx, seg.endIdx);
                    if (end < seg.startIdx) return "";
                    const pts = points.slice(seg.startIdx, end + 1);
                    let d = `M${pts[0][0]},${pts[0][1]}`;
                    for (let j = 1; j < pts.length; j++) {
                      d += ` H${pts[j][0]} V${pts[j][1]}`;
                    }
                    return d;
                  })()}
                  fill="none" stroke={seg.color} strokeWidth={1.5} opacity={1}
                />
              )}
            </g>
          ))}
          <circle cx={sx} cy={sy} r={1.5} fill={colors[clampedIdx] ?? color} />
        </svg>
      </div>
    );
  }

  const toStepPath = (pts: (readonly [number, number])[]) => {
    if (pts.length === 0) return "";
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` H${pts[i][0]} V${pts[i][1]}`;
    }
    return d;
  };

  const allPts = stepped ? toStepPath(points) : points.map(p => `${p[0]},${p[1]}`).join(" ");
  const activePts = stepped ? toStepPath(points.slice(0, clampedIdx + 1)) : points.slice(0, clampedIdx + 1).map(p => `${p[0]},${p[1]}`).join(" ");

  return (
    <div className="cf-kpi-sparkline">
      <svg
        width={width}
        height={height}
        overflow="visible"
        style={{ display: "block" }}
      >
        {/* Full trajectory — faded */}
        {stepped ? (
          <path d={allPts} fill="none" stroke={color} strokeWidth={1} opacity={0.15} />
        ) : (
          <polyline points={allPts} fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} />
        )}
        {/* Active segment — bright */}
        {stepped ? (
          <path d={activePts} fill="none" stroke={color} strokeWidth={1.5} opacity={1} />
        ) : (
          <polyline points={activePts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={1} />
        )}
        {/* Position dot */}
        <circle cx={sx} cy={sy} r={1.5} fill={color} />
      </svg>
    </div>
  );
})