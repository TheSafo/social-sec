import React from 'react';
import type { BenefitRow } from '../utils/calculations';
import { formatMoney } from '../utils/formatters';

interface BenefitTableProps {
  baseBenefit: string;
  setBaseBenefit: (val: string) => void;
  rows: BenefitRow[];
}

export const BenefitTable: React.FC<BenefitTableProps> = ({ baseBenefit, setBaseBenefit, rows }) => {
  return (
    <div className="mb-8 p-6 bg-panel backdrop-blur-sm rounded-[20px] shadow-[0_25px_50px_rgba(12,18,16,0.12)] border border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-ink">Benefit Table</h2>
          <p className="text-sm text-muted mt-1">Set your monthly benefit at age 62.</p>
          <p className="text-sm text-muted">We apply a claim multiplier plus COLA.</p>
        </div>
        <button
          onClick={() => location.reload()}
          className="text-sm text-accent-2 hover:text-accent font-medium whitespace-nowrap"
        >
          Reset defaults
        </button>
      </div>

      <div className="mb-6">
        <label className="block">
          <span className="sr-only">Base Benefit</span>
          <div className="relative rounded-xl shadow-sm max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-muted sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={baseBenefit}
              onChange={(e) => setBaseBenefit(e.target.value)}
              className="block w-full rounded-xl border-border bg-white/85 text-ink pl-7 pr-12 focus:border-accent focus:ring-accent focus:outline-none focus:outline-2 focus:outline-accent/30 sm:text-sm p-3 border font-mono"
              placeholder="0.00"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-muted sm:text-sm">/mo</span>
            </div>
          </div>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="bg-white/50 px-4 py-2 grid grid-cols-2 text-xs uppercase tracking-wider font-medium text-muted border-b border-border">
          <span>Age</span>
          <span className="text-right">Monthly benefit</span>
        </div>
        <div className="divide-y divide-border/50 max-h-108">
          {rows.map((row) => (
            <div key={row.age} className="px-4 py-3 grid grid-cols-2 text-sm text-ink hover:bg-white/50 transition-colors">
              <span className="font-mono">{row.age === 67 ? '67 (Full Retirement Age)' : row.age}</span>
              <span className="text-right font-mono">${formatMoney(row.monthly)}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
