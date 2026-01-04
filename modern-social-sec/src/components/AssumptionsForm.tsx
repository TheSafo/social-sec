import React from 'react';

interface AssumptionsFormProps {
  cola: string;
  setCola: (val: string) => void;
  interest: string;
  setInterest: (val: string) => void;
  federalTaxRate: string;
  setFederalTaxRate: (val: string) => void;
}

export const AssumptionsForm: React.FC<AssumptionsFormProps> = ({
  cola,
  setCola,
  interest,
  setInterest,
  federalTaxRate,
  setFederalTaxRate,
}) => {
  return (
    <div className="mb-8 p-6 bg-panel backdrop-blur-sm rounded-[20px] shadow-[0_25px_50px_rgba(12,18,16,0.12)] border border-border">
      <h2 className="text-xl font-serif font-bold mb-4 text-ink">Assumptions</h2>
      <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <label className="block">
          <span className="text-muted text-sm font-medium block mb-2">Annual COLA (% Cost of Living Adjustment)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={cola}
            onChange={(e) => setCola(e.target.value)}
            className="block w-full rounded-xl border-border bg-white/85 text-ink shadow-sm focus:border-accent focus:ring-accent focus:ring-opacity-50 sm:text-sm p-3 border font-mono outline-none focus:outline-2 focus:outline-accent/30"
          />
        </label>
        <label className="block">
          <span className="text-muted text-sm font-medium block mb-2">Interest Rate (% compounding rate)</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="block w-full rounded-xl border-border bg-white/85 text-ink shadow-sm focus:border-accent focus:ring-accent focus:ring-opacity-50 sm:text-sm p-3 border font-mono outline-none focus:outline-2 focus:outline-accent/30"
          />
        </label>
        <label className="block">
          <span className="text-muted text-sm font-medium block mb-2">Federal Tax Rate (%)</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={federalTaxRate}
            onChange={(e) => setFederalTaxRate(e.target.value)}
            className="block w-full rounded-xl border-border bg-white/85 text-ink shadow-sm focus:border-accent focus:ring-accent focus:ring-opacity-50 sm:text-sm p-3 border font-mono outline-none focus:outline-2 focus:outline-accent/30"
          />
        </label>
      </form>
    </div>
  );
};
