import { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { AssumptionsForm } from './components/AssumptionsForm';
import { BenefitTable } from './components/BenefitTable';
import { ComparisonPanel } from './components/ComparisonPanel';
import { TotalsPanel } from './components/TotalsPanel';
import {
  buildBenefitRowsFromBase,
  totalAtThroughAge,
  findBreakEvenAge,
  balanceSeries,
  BASE_CLAIM_AGE,
} from './utils/calculations';

function App() {
  const [baseBenefit, setBaseBenefit] = useState('1200');
  const [throughAge, setThroughAge] = useState('85');
  const [cola, setCola] = useState('1');
  const [interest, setInterest] = useState('4');
  const [federalTaxRate, setFederalTaxRate] = useState('20');
  const [claimAgeA, setClaimAgeA] = useState(62);
  const [claimAgeB, setClaimAgeB] = useState(70);

  // Derived state
  const parseNumber = (value: string, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const colaAnnual = parseNumber(cola) / 100;
  const interestAnnual = parseNumber(interest) / 100;
  const taxRate = parseNumber(federalTaxRate) / 100;
  const throughAgeValue = parseNumber(throughAge);

  const baseBenefitValue = parseNumber(baseBenefit);
  const benefitRows = useMemo(
    () => buildBenefitRowsFromBase(baseBenefitValue, colaAnnual),
    [baseBenefitValue, colaAnnual]
  );

  const options = useMemo(
    () => benefitRows.map((r) => ({ claimAge: r.age, monthly: r.monthly })),
    [benefitRows]
  );

  const totals = useMemo(() => {
    return options
      .map((opt) => ({
        ...opt,
        total: totalAtThroughAge(opt, BASE_CLAIM_AGE, throughAgeValue, colaAnnual, interestAnnual, taxRate),
      }))
      .sort((a, b) => b.total - a.total);
  }, [options, throughAgeValue, colaAnnual, interestAnnual, taxRate]);

  const seriesA = useMemo(
    () =>
      balanceSeries(
        options.find((o) => o.claimAge === claimAgeA) || options[0],
        BASE_CLAIM_AGE,
        100,
        colaAnnual,
        interestAnnual,
        taxRate
      ),
    [options, claimAgeA, colaAnnual, interestAnnual, taxRate]
  );

  const seriesB = useMemo(
    () =>
      balanceSeries(
        options.find((o) => o.claimAge === claimAgeB) || options[1],
        BASE_CLAIM_AGE,
        100,
        colaAnnual,
        interestAnnual,
        taxRate
      ),
    [options, claimAgeB, colaAnnual, interestAnnual, taxRate]
  );

  const breakEven = useMemo(() => {
    const optA = options.find((o) => o.claimAge === claimAgeA) || options[0];
    const optB = options.find((o) => o.claimAge === claimAgeB) || options[1];
    
    // Safety check if options aren't ready
    if (!optA || !optB) return null;

    if (optA.claimAge === optB.claimAge) return null;
    return findBreakEvenAge(optA, optB, BASE_CLAIM_AGE, 100, colaAnnual, interestAnnual, taxRate);
  }, [options, claimAgeA, claimAgeB, colaAnnual, interestAnnual, taxRate]);

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          <AssumptionsForm
            cola={cola}
            setCola={setCola}
            interest={interest}
            setInterest={setInterest}
            federalTaxRate={federalTaxRate}
            setFederalTaxRate={setFederalTaxRate}
          />
          <BenefitTable
            baseBenefit={baseBenefit}
            setBaseBenefit={setBaseBenefit}
            rows={benefitRows}
          />
        </div>
        
        <div className="lg:col-span-5 space-y-8 sticky top-8">
           <ComparisonPanel
            options={options}
            selectedAgeA={claimAgeA}
            setSelectedAgeA={setClaimAgeA}
            selectedAgeB={claimAgeB}
            setSelectedAgeB={setClaimAgeB}
            seriesA={seriesA}
            seriesB={seriesB}
            breakEven={breakEven}
          />
          <TotalsPanel
            throughAge={throughAge}
            setThroughAge={setThroughAge}
            totals={totals}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;
