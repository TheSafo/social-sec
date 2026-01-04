import React from 'react';

interface AssumptionsFormProps {
  cola: number;
  setCola: (val: number) => void;
  interest: number;
  setInterest: (val: number) => void;
}

export const AssumptionsForm: React.FC<AssumptionsFormProps> = ({ cola, setCola, interest, setInterest }) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Assumptions</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="block">
          <span className="text-gray-700 text-sm font-medium block mb-1">Annual COLA (% Cost of Living Adjustment)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={cola}
            onChange={(e) => setCola(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </label>
        <label className="block">
          <span className="text-gray-700 text-sm font-medium block mb-1">Interest Rate (% compounding rate)</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={interest}
            onChange={(e) => setInterest(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </label>
      </form>
    </div>
  );
};
