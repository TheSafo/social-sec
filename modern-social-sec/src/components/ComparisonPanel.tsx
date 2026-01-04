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
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Break-even Comparison</h2>
      <p className="text-sm text-gray-500 mb-6">Pick two claim ages to find the age where they break even.</p>

      <div className="flex gap-4 mb-6">
        <label className="block w-full">
          <span className="text-gray-700 text-sm font-medium mb-1 block">Claim Age (Lower Option)</span>
          <select
            value={selectedAgeA}
            onChange={(e) => setSelectedAgeA(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            {options.map((opt) => (
              <option key={opt.claimAge} value={opt.claimAge}>
                {opt.claimAge}
              </option>
            ))}
          </select>
        </label>
        <label className="block w-full">
          <span className="text-gray-700 text-sm font-medium mb-1 block">Claim Age (Higher Option)</span>
          <select
            value={selectedAgeB}
            onChange={(e) => setSelectedAgeB(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
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

      <div className="bg-gray-50 p-4 rounded-md text-center">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Result</p>
        <p className="text-3xl font-bold text-gray-900 my-1">
          {breakEven ? `~${breakEven.toFixed(1)} years` : 'No break-even found'}
        </p>
        <p className="text-sm text-gray-600">
          {breakEven
            ? `Claim ${Math.max(selectedAgeA, selectedAgeB)} overtakes claim ${Math.min(selectedAgeA, selectedAgeB)} at this age.`
            : `No crossover before reaching age 100.`}
        </p>
      </div>
    </div>
  );
};
