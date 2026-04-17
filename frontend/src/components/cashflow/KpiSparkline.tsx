"use client";

import { memo } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

interface Props {
  data: number[];
  color: string;
  colors?: string[];
  selectedIndex?: number;
  stepped?: boolean;
  width?: number;
  height?: number;
  onHoverIndex?: (i: number | null) => void;
  onSelectIndex?: (i: number) => void;
}

export default memo(function KpiSparkline({
  data, color, colors, selectedIndex = 0, stepped = false, width = 100, height = 24,
  onHoverIndex, onSelectIndex,
}: Props) {
  const safeData = data.map(v => (Number.isFinite(v) ? v : 0));
  if (safeData.length < 2) return null;

  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const range = max - min || 1;
  const pad = 3;

  const points = safeData.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 6) + 3;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const clampedIdx = Math.max(0, Math.min(selectedIndex, points.length - 1));
  const [sx, sy] = points[clampedIdx];

  const indexFromEvent = (e: ReactMouseEvent<SVGElement>) => {
    const rect = (e.currentTarget.ownerSVGElement ?? e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = Math.round(((x - 3) / (width - 6)) * (data.length - 1));
    return Math.max(0, Math.min(i, data.length - 1));
  };

  const interactive = !!(onHoverIndex || onSelectIndex);
  const overlay = interactive ? (
    <rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill="transparent"
      pointerEvents="all"
      onMouseMove={(e) => onHoverIndex?.(indexFromEvent(e))}
      onMouseLeave={() => onHoverIndex?.(null)}
      onClick={(e) => onSelectIndex?.(indexFromEvent(e))}
      style={{ cursor: onSelectIndex ? "pointer" : "default" }}
    />
  ) : null;

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
      <div className="mt-2 flex justify-center">
        <svg width={width} height={height} overflow="visible" style={{ display: "block" }} role="img" aria-label="Sparkline chart">
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
          {overlay}
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
    <div className="mt-2 flex justify-center">
      <svg
        width={width}
        height={height}
        overflow="visible"
        style={{ display: "block" }}
        role="img"
        aria-label="Sparkline chart"
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
        {overlay}
      </svg>
    </div>
  );
})