import React, { useMemo, useState, useRef } from 'react';
import type { BalanceSeries, ClaimOption } from '../utils/calculations';
import { formatMoney } from '../utils/formatters';

interface BreakEvenChartProps {
  optionA: ClaimOption;
  optionB: ClaimOption;
  seriesA: BalanceSeries;
  seriesB: BalanceSeries;
  startAge: number;
  maxAge: number;
  breakEven: number | null;
}

export const BreakEvenChart: React.FC<BreakEvenChartProps> = ({
  optionA,
  optionB,
  seriesA,
  seriesB,
  startAge,
  maxAge,
  breakEven,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; age: number; valA: number; valB: number } | null>(null);

  const width = 360;
  const height = 160;
  const padding = 10;

  const { pathA, pathB, crossX, maxValue } = useMemo(() => {
    const sampleEvery = 12;
    const sample = (series: BalanceSeries) =>
      series.ages
        .map((age, i) => ({ age, value: series.balances[i] }))
        .filter((_, i) => i % sampleEvery === 0);

    const pointsA = sample(seriesA);
    const pointsB = sample(seriesB);

    const allValues = [...pointsA, ...pointsB].map((p) => p.value);
    const minVal = Math.min(...allValues, 0);
    const maxVal = Math.max(...allValues, 1);

    const scaleX = (age: number) =>
      padding + ((age - startAge) / (maxAge - startAge || 1)) * (width - padding * 2);
    const scaleY = (value: number) =>
      height - padding - ((value - minVal) / (maxVal - minVal || 1)) * (height - padding * 2);

    const buildPath = (points: { age: number; value: number }[]) =>
      points
        .map((p, i) => {
          const x = scaleX(p.age);
          const y = scaleY(p.value);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');

    const crossXVal = breakEven ? scaleX(breakEven) : null;

    return {
      pathA: buildPath(pointsA),
      pathB: buildPath(pointsB),
      crossX: crossXVal,
      maxValue: maxVal,
    };
  }, [seriesA, seriesB, startAge, maxAge, breakEven]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    const scaleXInv = (x: number) => {
      const p = (x - padding) / (width - padding * 2);
      return startAge + p * (maxAge - startAge);
    };

    const rawAge = scaleXInv(clientX);
    const snappedAge = Math.min(Math.max(Math.round(rawAge), Math.ceil(startAge)), Math.floor(maxAge));

    // Find values
    const startMonth = Math.round(startAge * 12);
    const snappedMonth = Math.round(snappedAge * 12);
    const index = Math.min(Math.max(snappedMonth - startMonth, 0), seriesA.ages.length - 1);

    const valA = seriesA.balances[index];
    const valB = seriesB.balances[index];

    // Calculate chart X for the line
    const chartX = padding + ((snappedAge - startAge) / (maxAge - startAge || 1)) * (width - padding * 2);

    setHover({ x: chartX, age: snappedAge, valA, valB });
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-400 pointer-events-none pb-2 pl-1">
        <span>${formatMoney(maxValue)}</span>
        <span>$0</span>
      </div>
      
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto bg-white/70 rounded-[16px] border border-border cursor-crosshair touch-none"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <path d={pathA} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
        <path d={pathB} fill="none" stroke="var(--color-accent-2)" strokeWidth="2.5" />
        
        {crossX !== null && (
          <line
            x1={crossX}
            y1={padding}
            x2={crossX}
            y2={height - padding}
            stroke="var(--color-ink)"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        )}

        {hover && (
          <line
            x1={hover.x}
            y1={padding}
            x2={hover.x}
            y2={height - padding}
            stroke="var(--color-ink)"
            strokeOpacity="0.65"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        )}
      </svg>

      <div className="flex justify-between text-xs text-muted mt-1 px-2 font-mono uppercase tracking-wider">
        <span>Age {startAge}</span>
        <span>Age {maxAge}</span>
      </div>

      {hover && (
        <div 
          className="absolute z-10 bg-ink/90 backdrop-blur shadow-lg rounded-xl p-3 text-xs text-paper pointer-events-none"
          style={{ 
            top: 10, 
            left: Math.min(Math.max(hover.x - 70, 0), width - 140) // simplistic clamping for demo
          }}
        >
          <div className="font-bold mb-1 font-serif text-sm">Age {hover.age}</div>
          <div className="text-accent">Claim {optionA.claimAge}: ${formatMoney(hover.valA)}</div>
          <div className="text-accent-2-light">Claim {optionB.claimAge}: ${formatMoney(hover.valB)}</div>
          <div className="text-gray-400 mt-1 pt-1 border-t border-white/20">Diff: ${formatMoney(Math.abs(hover.valA - hover.valB))}</div>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-2 text-xs font-medium text-muted font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
          <span>Claim {optionA.claimAge}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-2"></div>
          <span>Claim {optionB.claimAge}</span>
        </div>
      </div>
    </div>
  );
};
