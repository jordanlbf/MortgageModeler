"use client";

import { useState, useMemo } from "react";

export interface AdvancedTaxInputs {
  salary: number;
  rental: number;
  interest: number;
  dividend: number;
  franking: number;
  capitalGain: number;
  rentalDeductions: number;
  workDeductions: number;
  cgtDiscount: boolean;
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
  setCapitalGain: (v: number) => void;
  setRentalDeductions: (v: number) => void;
  setWorkDeductions: (v: number) => void;
  setCgtDiscount: (v: boolean) => void;
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
  const [capitalGain, setCapitalGain] = useState(0);

  // ── Deductions ───────────────────────────────
  const [rentalDeductions, setRentalDeductions] = useState(0);
  const [workDeductions, setWorkDeductions] = useState(0);
  const [cgtDiscount, setCgtDiscount] = useState(true);

  // ── Adjustments ──────────────────────────────
  const [salSac, setSalSac] = useState(0);
  const [rfb, setRfb] = useState(0);
  const [hecsBal, setHecsBal] = useState(35_000);
  const [phi, setPhi] = useState(false);

  // ── Derived income measures ──────────────────
  const incomeMeasures = useMemo<IncomeMeasures>(() => {
    const netCapitalGain = cgtDiscount ? capitalGain * 0.5 : capitalGain;
    const assessable = salary + rental + interest + dividend + franking + netCapitalGain;
    const totalDeductions = rentalDeductions + workDeductions;
    const taxableIncome = Math.max(0, assessable - totalDeductions);
    const netInvestmentLoss = Math.max(0, rentalDeductions - rental);
    const repaymentIncome = taxableIncome + rfb + salSac + netInvestmentLoss;
    const mlsIncome = repaymentIncome;
    return { assessableIncome: assessable, totalDeductions, taxableIncome, repaymentIncome, mlsIncome };
  }, [salary, rental, interest, dividend, franking, capitalGain, cgtDiscount, rentalDeductions, workDeductions, rfb, salSac]);

  return {
    inputs: { salary, rental, interest, dividend, franking, capitalGain, rentalDeductions, workDeductions, cgtDiscount, salSac, rfb, hecsBal, phi },
    setters: { setSalary, setRental, setInterest, setDividend, setFranking, setCapitalGain, setRentalDeductions, setWorkDeductions, setCgtDiscount, setSalSac, setRfb, setHecsBal, setPhi },
    incomeMeasures,
  };
}
