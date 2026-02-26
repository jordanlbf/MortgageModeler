"use client";

import { useState, useMemo } from "react";
import type { Frequency } from "@/lib/engine";
import { generateSchedule } from "@/lib/engine";
import GlassCard from "@/components/ui/GlassCard";
import LoanControls from "./LoanControls";
import HeroStats from "./HeroStats";
import BalanceChart from "./BalanceChart";
import ScheduleTable from "./ScheduleTable";

const PERIODS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

export default function AmortisationView() {
  const [principal, setPrincipal] = useState(500_000);
  const [rate, setRate] = useState(6.2);
  const [years, setYears] = useState(30);
  const [frequency, setFrequency] = useState<Frequency>("monthly");

  const schedule = useMemo(
    () => generateSchedule(principal, rate / 100, years, frequency),
    [principal, rate, years, frequency]
  );

  const chartData = useMemo(() => {
    const ppy = PERIODS_PER_YEAR[frequency];
    const data = [];
    for (let y = 0; y <= years; y++) {
      if (y === 0) {
        data.push({ y: 0, bal: principal, int: 0, eq: 0 });
      } else {
        const idx = Math.min(y * ppy - 1, schedule.rows.length - 1);
        data.push({
          y,
          bal: schedule.rows[idx].closingBalance,
          int: schedule.rows[idx].totalInterest,
          eq: principal - schedule.rows[idx].closingBalance,
        });
      }
    }
    return data;
  }, [schedule, years, frequency, principal]);

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-8">
      {/* Hero stats */}
      <HeroStats
        schedule={schedule}
        principal={principal}
        frequency={frequency}
        chartData={chartData}
      />

      {/* Controls */}
      <GlassCard className="mb-6 p-5">
        <LoanControls
          principal={principal}
          setPrincipal={setPrincipal}
          rate={rate}
          setRate={setRate}
          years={years}
          setYears={setYears}
          frequency={frequency}
          setFrequency={setFrequency}
        />
      </GlassCard>

      {/* Chart */}
      <GlassCard className="mb-6 px-5 pb-4 pt-6" glow>
        <BalanceChart data={chartData} />
      </GlassCard>

      {/* Table */}
      <GlassCard>
        <ScheduleTable schedule={schedule} frequency={frequency} />
      </GlassCard>
    </div>
  );
}
