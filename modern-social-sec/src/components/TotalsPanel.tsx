import React from 'react';
import type { TotalRow } from '../utils/calculations';
import { formatMoney } from '../utils/formatters';

interface TotalsPanelProps {
  throughAge: string;
  setThroughAge: (age: string) => void;
  totals: TotalRow[];
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({ throughAge, setThroughAge, totals }) => {
  return (
    <div className="mb-8 p-6 bg-panel backdrop-blur-sm rounded-[20px] shadow-[0_25px_50px_rgba(12,18,16,0.12)] border border-border">
      <h2 className="text-xl font-serif font-bold mb-2 text-ink">Life Expectancy to Age ___</h2>
      <p className="text-sm text-muted mb-4">
        Enter the age you (or your spouse) expect to claim social security benefits through. This section will sort claim ages and find the highest social security earnings through that age.
      </p>
      <div className="text-sm text-ink bg-accent/10 p-4 rounded-xl border border-accent/20 mb-6 font-sans">
        <p className="font-medium mb-1 font-serif text-accent-2">Remember the Survivor Benefit</p>
        <p className="opacity-90">If one spouse passes away, the survivor can receive the higher of the two benefit amounts. However, if you claim survivor benefits before your FRA (Full Retirement Age) payment will be permanently reduced by up to 70%.</p>
      </div>

      <div className="mb-6">
        <label className="block">
          <span className="sr-only">Through Age</span>
          <input
            type="number"
            step="1"
            min="70"
            max="110"
            value={throughAge}
            onChange={(e) => setThroughAge(e.target.value)}
            className="block w-full max-w-xs rounded-xl border-border bg-white/85 text-ink shadow-sm focus:border-accent focus:ring-accent focus:outline-none focus:outline-2 focus:outline-accent/30 sm:text-sm p-3 border font-mono"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="divide-y divide-border/50">
          {totals.map((row, index) => (
            <div
              key={row.claimAge}
              className={`px-4 py-3 grid grid-cols-1 sm:grid-cols-3 items-center text-sm gap-2 sm:gap-0 transition-colors ${
                index === 0 ? 'bg-accent/5' : 'bg-transparent hover:bg-white/50'
              }`}
            >
              <span className={`font-mono font-medium ${index === 0 ? 'text-accent' : 'text-ink'}`}>Claim {row.claimAge}</span>
              <span className="text-muted sm:text-center font-mono">${formatMoney(row.monthly)}/mo</span>
              <span className={`sm:text-right font-mono font-medium ${index === 0 ? 'text-accent' : 'text-ink'}`}>
                ${formatMoney(row.total)} by age {throughAge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
