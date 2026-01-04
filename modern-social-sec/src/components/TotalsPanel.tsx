import React from 'react';
import type { TotalRow } from '../utils/calculations';
import { formatMoney } from '../utils/formatters';

interface TotalsPanelProps {
  throughAge: number;
  setThroughAge: (age: number) => void;
  totals: TotalRow[];
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({ throughAge, setThroughAge, totals }) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Life Expectancy to Age ___</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter the age you (or your spouse) expect to claim social security benefits through. This section will sort claim ages and find the highest social security earnings through that age.
      </p>
      <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded border border-amber-100 mb-6">
        <p className="font-medium mb-1">Remember the Survivor Benefit</p>
        <p>If one spouse passes away, the survivor can receive the higher of the two benefit amounts. However, if you claim survivor benefits before your FRA (Full Retirement Age) payment will be permanently reduced by up to 70%.</p>
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
            onChange={(e) => setThroughAge(Number(e.target.value))}
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200">
        <div className="divide-y divide-gray-200">
          {totals.map((row, index) => (
            <div
              key={row.claimAge}
              className={`px-4 py-3 grid grid-cols-1 sm:grid-cols-3 items-center text-sm gap-2 sm:gap-0 ${
                index === 0 ? 'bg-indigo-50' : 'bg-white'
              }`}
            >
              <span className="font-medium text-gray-900">Claim {row.claimAge}</span>
              <span className="text-gray-600 sm:text-center">${formatMoney(row.monthly)}/mo</span>
              <span className={`sm:text-right font-medium ${index === 0 ? 'text-indigo-700' : 'text-gray-900'}`}>
                ${formatMoney(row.total)} by age {throughAge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
