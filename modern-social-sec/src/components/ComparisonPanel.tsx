import React from 'react';
import type { ClaimOption, BalanceSeries } from '../utils/calculations';
import { BreakEvenChart } from './BreakEvenChart';

interface ComparisonPanelProps {
  options: ClaimOption[];
  selectedAgeA: number;
  setSelectedAgeA: (age: number) => void;
  selectedAgeB: number;
  setSelectedAgeB: (age: number) => void;
  seriesA: BalanceSeries;
  seriesB: BalanceSeries;
  breakEven: number | null;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  options,
  selectedAgeA,
  setSelectedAgeA,
  selectedAgeB,
  setSelectedAgeB,
  seriesA,
  seriesB,
  breakEven,
}) => {
  const optionA = options.find((o) => o.claimAge === selectedAgeA) || options[0];
  const optionB = options.find((o) => o.claimAge === selectedAgeB) || options[1];

  return (
    <div className="mb-8 p-6 bg-panel backdrop-blur-sm rounded-[20px] shadow-[0_25px_50px_rgba(12,18,16,0.12)] border border-border">
      <h2 className="text-xl font-serif font-bold mb-2 text-ink">Break-even Comparison</h2>
      <p className="text-sm text-muted mb-6">Pick two claim ages to find the age where they break even.</p>

      <div className="flex gap-4 mb-6">
        <label className="block w-full">
          <span className="text-muted text-sm font-medium mb-1 block"><b>Claim Age (Lower Option)</b></span>
          <select
            value={selectedAgeA}
            onChange={(e) => setSelectedAgeA(Number(e.target.value))}
            className="block w-full rounded-xl border-border bg-white/85 text-ink shadow-sm focus:border-accent focus:ring-accent focus:outline-none focus:outline-2 focus:outline-accent/30 sm:text-sm p-3 border font-mono"
          >
            {options.map((opt) => (
              <option key={opt.claimAge} value={opt.claimAge}>
                {opt.claimAge}
              </option>
            ))}
          </select>
        </label>
        <label className="block w-full">
          <span className="text-muted text-sm font-medium mb-1 block"><b>Claim Age (Higher Option)</b></span>
          <select
            value={selectedAgeB}
            onChange={(e) => setSelectedAgeB(Number(e.target.value))}
            className="block w-full rounded-xl border-border bg-white/85 text-ink shadow-sm focus:border-accent focus:ring-accent focus:outline-none focus:outline-2 focus:outline-accent/30 sm:text-sm p-3 border font-mono"
          >
            {options.map((opt) => (
              <option key={opt.claimAge} value={opt.claimAge}>
                {opt.claimAge}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-6">
        <BreakEvenChart
          optionA={optionA}
          optionB={optionB}
          seriesA={seriesA}
          seriesB={seriesB}
          startAge={62}
          maxAge={100}
          breakEven={breakEven}
        />
      </div>

      <div className="bg-white/65 p-6 rounded-[16px] border border-dashed border-border text-center">
        <p className="text-xs font-medium text-muted uppercase tracking-[0.2em] mb-2">Result</p>
        <p className="text-3xl font-serif font-bold text-ink my-1">
          {breakEven ? `~${breakEven.toFixed(1)} years` : 'No break-even found'}
        </p>
        <p className="text-sm text-muted">
          {breakEven
            ? `Claim ${Math.max(selectedAgeA, selectedAgeB)} overtakes claim ${Math.min(selectedAgeA, selectedAgeB)} at this age.`
            : `No crossover before reaching age 100.`}
        </p>
      </div>
    </div>
  );
};
