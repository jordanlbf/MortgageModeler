"use client";

import { useState, useMemo } from "react";

export interface AdvancedTaxInputs {
  salary: number;
  rental: number;
  interest: number;
  dividend: number;
  franking: number;
  capitalGainShort: number;
  capitalGainLong: number;
  rentalDeductions: number;
  workDeductions: number;
  salSac: number;
  rfb: number;
  hecsBal: number;
  phi: boolean;
}

export interface AdvancedTaxSetters {
  setSalary: (v: number) => void;
  setRental: (v: number) => void;
  setInterest: (v: number) => void;
  setDividend: (v: number) => void;
  setFranking: (v: number) => void;
  setCapitalGainShort: (v: number) => void;
  setCapitalGainLong: (v: number) => void;
  setRentalDeductions: (v: number) => void;
  setWorkDeductions: (v: number) => void;
  setSalSac: (v: number) => void;
  setRfb: (v: number) => void;
  setHecsBal: (v: number) => void;
  setPhi: (v: boolean) => void;
}

export interface IncomeMeasures {
  assessableIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  repaymentIncome: number;
  mlsIncome: number;
}

export interface AdvancedTaxState {
  inputs: AdvancedTaxInputs;
  setters: AdvancedTaxSetters;
  incomeMeasures: IncomeMeasures;
}

export function useAdvancedTaxState(): AdvancedTaxState {
  // ── Income ───────────────────────────────────
  const [salary, setSalary] = useState(100_000);
  const [rental, setRental] = useState(0);
  const [interest, setInterest] = useState(0);
  const [dividend, setDividend] = useState(0);
  const [franking, setFranking] = useState(0);
  const [capitalGainShort, setCapitalGainShort] = useState(0);
  const [capitalGainLong, setCapitalGainLong] = useState(0);

  // ── Deductions ───────────────────────────────
  const [rentalDeductions, setRentalDeductions] = useState(0);
  const [workDeductions, setWorkDeductions] = useState(0);

  // ── Adjustments ──────────────────────────────
  const [salSac, setSalSac] = useState(0);
  const [rfb, setRfb] = useState(0);
  const [hecsBal, setHecsBal] = useState(35_000);
  const [phi, setPhi] = useState(false);

  // ── Derived income measures ──────────────────
  const incomeMeasures = useMemo<IncomeMeasures>(() => {
    // TODO: move CGT split to backend when schema is updated
    const netCapitalGain = capitalGainShort + capitalGainLong * 0.5;
    const assessable = salary + rental + interest + dividend + franking + netCapitalGain;
    const totalDeductions = rentalDeductions + workDeductions;
    const taxableIncome = Math.max(0, assessable - totalDeductions);
    const netInvestmentLoss = Math.max(0, rentalDeductions - rental);
    const repaymentIncome = taxableIncome + rfb + salSac + netInvestmentLoss;
    const mlsIncome = repaymentIncome;
    return { assessableIncome: assessable, totalDeductions, taxableIncome, repaymentIncome, mlsIncome };
  }, [salary, rental, interest, dividend, franking, capitalGainShort, capitalGainLong, rentalDeductions, workDeductions, rfb, salSac]);

  return {
    inputs: { salary, rental, interest, dividend, franking, capitalGainShort, capitalGainLong, rentalDeductions, workDeductions, salSac, rfb, hecsBal, phi },
    setters: { setSalary, setRental, setInterest, setDividend, setFranking, setCapitalGainShort, setCapitalGainLong, setRentalDeductions, setWorkDeductions, setSalSac, setRfb, setHecsBal, setPhi },
    incomeMeasures,
  };
}
