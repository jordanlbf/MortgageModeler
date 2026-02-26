"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatCompact } from "@/lib/formatters";

interface ChartDataPoint {
  y: number;
  bal: number;
  int: number;
  eq: number;
}

interface BalanceChartProps {
  data: ChartDataPoint[];
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[rgba(15,15,25,0.9)] px-3.5 py-2.5 text-[11px] backdrop-blur-xl">
      <div className="mb-1 text-[10px] text-white/30">Year {label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  );
}

const LEGEND_ITEMS = [
  { color: "#818cf8", label: "Balance", dashed: false },
  { color: "#f472b6", label: "Interest", dashed: true },
  { color: "#34d399", label: "Equity", dashed: false },
];

export default function BalanceChart({ data }: BalanceChartProps) {
  return (
    <div>
      <div className="mb-4 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
        Balance & equity over time
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="gradBal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradInt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="y"
            stroke="transparent"
            tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${formatCompact(v)}`}
            width={45}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="bal" name="Balance" stroke="#818cf8" strokeWidth={2} fill="url(#gradBal)" />
          <Area type="monotone" dataKey="int" name="Interest" stroke="#f472b6" strokeWidth={1.5} fill="url(#gradInt)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="eq" name="Equity" stroke="#34d399" strokeWidth={1.5} fill="url(#gradEq)" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2.5 flex gap-5 px-1">
        {LEGEND_ITEMS.map(({ color, label, dashed }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-white/25">
            <span
              className="inline-block w-3"
              style={{
                height: dashed ? 0 : 1.5,
                borderTop: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
