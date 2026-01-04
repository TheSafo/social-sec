import React from 'react';
import type { BenefitRow } from '../utils/calculations';
import { formatMoney } from '../utils/formatters';

interface BenefitTableProps {
  baseBenefit: number;
  setBaseBenefit: (val: number) => void;
  rows: BenefitRow[];
}

export const BenefitTable: React.FC<BenefitTableProps> = ({ baseBenefit, setBaseBenefit, rows }) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Benefit Table</h2>
          <p className="text-sm text-gray-500 mt-1">Set your monthly benefit at age 62.</p>
          <p className="text-sm text-gray-500">We apply a claim multiplier plus COLA.</p>
        </div>
        <button
          onClick={() => setBaseBenefit(1200)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
        >
          Reset defaults
        </button>
      </div>

      <div className="mb-6">
        <label className="block">
          <span className="sr-only">Base Benefit</span>
          <div className="relative rounded-md shadow-sm max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={baseBenefit}
              onChange={(e) => setBaseBenefit(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="0.00"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">/mo</span>
            </div>
          </div>
        </label>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200">
        <div className="bg-gray-50 px-4 py-2 grid grid-cols-2 text-sm font-medium text-gray-700 border-b border-gray-200">
          <span>Age</span>
          <span className="text-right">Monthly benefit</span>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {rows.map((row) => (
            <div key={row.age} className="px-4 py-2 grid grid-cols-2 text-sm text-gray-900 hover:bg-gray-50">
              <span>{row.age === 67 ? '67 (Full Retirement Age)' : row.age}</span>
              <span className="text-right">${formatMoney(row.monthly)}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
