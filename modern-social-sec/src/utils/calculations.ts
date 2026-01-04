export const BASE_CLAIM_AGE = 62;
export const MAX_CLAIM_AGE = 70;

export const CLAIM_MULTIPLIERS = [
  { age: 62, factor: 0.7 },
  { age: 63, factor: 0.75 },
  { age: 64, factor: 0.8 },
  { age: 65, factor: 0.8667 },
  { age: 66, factor: 0.9333 },
  { age: 67, factor: 1.0 },
  { age: 68, factor: 1.08 },
  { age: 69, factor: 1.16 },
  { age: 70, factor: 1.24 },
];

export interface BenefitRow {
  age: number;
  monthly: number;
}

export interface ClaimOption {
  claimAge: number;
  monthly: number;
}

export interface TotalRow extends ClaimOption {
  total: number;
}

export const buildBenefitRowsFromBase = (baseMonthly: number, colaAnnual: number): BenefitRow[] => {
  const baseClaim = CLAIM_MULTIPLIERS.find((row) => row.age === BASE_CLAIM_AGE);
  const piaAt62 = baseMonthly / (baseClaim?.factor ?? 1);

  return CLAIM_MULTIPLIERS.map(({ age, factor }) => {
    const years = age - BASE_CLAIM_AGE;
    const colaMultiplier = Math.pow(1 + colaAnnual, years);
    return { age, monthly: piaAt62 * factor * colaMultiplier };
  });
};

export const monthlyPaymentAtTime = (baseMonthly: number, monthsSinceClaim: number, colaAnnual: number): number => {
  if (colaAnnual <= 0) return baseMonthly;
  const years = Math.floor(monthsSinceClaim / 12);
  return baseMonthly * Math.pow(1 + colaAnnual, years);
};

export const totalAtThroughAge = (
  option: ClaimOption,
  startAge: number,
  throughAge: number,
  colaAnnual: number,
  interestAnnual: number,
  taxRate: number
): number => {
  const startMonth = Math.round(startAge * 12);
  const endMonth = Math.round(throughAge * 12);
  const claimMonth = Math.round(option.claimAge * 12);

  const rMonthly = interestAnnual > 0 ? Math.pow(1 + interestAnnual, 1 / 12) - 1 : 0;
  const taxableBenefitRate = 0.85;

  let balance = 0;
  for (let month = startMonth; month < endMonth; month += 1) {
    if (rMonthly > 0) {
      const interestEarned = balance * rMonthly;
      const interestTax = interestEarned * taxRate;
      balance += interestEarned - interestTax;
    }
    if (month >= claimMonth) {
      const monthsSinceClaim = month - claimMonth;
      const payment = monthlyPaymentAtTime(option.monthly, monthsSinceClaim, colaAnnual);
      balance += payment * (1 - taxRate * taxableBenefitRate);
    }
  }
  return balance;
};

export interface BalanceSeries {
  ages: number[];
  balances: number[];
}

export const balanceSeries = (
  option: ClaimOption,
  startAge: number,
  maxAge: number,
  colaAnnual: number,
  interestAnnual: number,
  taxRate: number
): BalanceSeries => {
  const startMonth = Math.round(startAge * 12);
  const endMonth = Math.round(maxAge * 12);
  const claimMonth = Math.round(option.claimAge * 12);
  const rMonthly = interestAnnual > 0 ? Math.pow(1 + interestAnnual, 1 / 12) - 1 : 0;
  const taxableBenefitRate = 0.85;

  const ages: number[] = [];
  const balances: number[] = [];
  let balance = 0;

  for (let t = startMonth; t <= endMonth; t += 1) {
    if (t > startMonth) {
      const month = t - 1;
      if (rMonthly > 0) {
        const interestEarned = balance * rMonthly;
        const interestTax = interestEarned * taxRate;
        balance += interestEarned - interestTax;
      }

      if (month >= claimMonth) {
        const monthsSinceClaim = month - claimMonth;
        const payment = monthlyPaymentAtTime(option.monthly, monthsSinceClaim, colaAnnual);
        balance += payment * (1 - taxRate * taxableBenefitRate);
      }
    }

    ages.push(t / 12);
    balances.push(balance);
  }

  return { ages, balances };
};

export const findBreakEvenAge = (
  optionA: ClaimOption,
  optionB: ClaimOption,
  startAge: number,
  maxAge: number,
  colaAnnual: number,
  interestAnnual: number,
  taxRate: number
): number | null => {
  const seriesA = balanceSeries(optionA, startAge, maxAge, colaAnnual, interestAnnual, taxRate);
  const seriesB = balanceSeries(optionB, startAge, maxAge, colaAnnual, interestAnnual, taxRate);

  const minAge = Math.max(optionA.claimAge, optionB.claimAge);
  for (let i = 0; i < seriesA.ages.length; i += 1) {
    const age = seriesA.ages[i];
    if (age >= minAge && seriesB.balances[i] >= seriesA.balances[i]) {
      return age;
    }
  }
  return null;
};
