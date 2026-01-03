const BASE_CLAIM_AGE = 62;
const MAX_CLAIM_AGE = 70;
const BENEFIT_GROWTH_RATE = 0.08;
const DEFAULT_BASE_BENEFIT = 2632;

const tableRoot = document.getElementById("benefit-table");
const tableError = document.getElementById("table-error");
const resetTableButton = document.getElementById("reset-table");

const inputs = {
  baseBenefit: document.getElementById("base-benefit"),
  startAge: document.getElementById("start-age"),
  throughAge: document.getElementById("through-age"),
  maxAge: document.getElementById("max-age"),
  cola: document.getElementById("cola"),
  interest: document.getElementById("interest"),
};

const claimSelectA = document.getElementById("claim-a");
const claimSelectB = document.getElementById("claim-b");
const breakEvenResult = document.getElementById("break-even-result");
const totalsTable = document.getElementById("totals-table");

const heroBreakEven = document.getElementById("hero-break-even");
const heroBest = document.getElementById("hero-best");
const heroGap = document.getElementById("hero-gap");
const chartPathA = document.getElementById("chart-a");
const chartPathB = document.getElementById("chart-b");
const chartCross = document.getElementById("chart-cross");
const chartHover = document.getElementById("chart-hover");
const chartTooltip = document.getElementById("chart-tooltip");
const chartSvg = document.getElementById("break-even-chart");
const legendA = document.getElementById("legend-a");
const legendB = document.getElementById("legend-b");

let chartState = null;

const formatMoney = (value) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

const formatCurrency = (value) => `$${formatMoney(value)}`;

const parseNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCurrency = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = String(value).replace(/[^0-9.]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildBenefitRowsFromBase = (baseMonthly) => {
  const rows = [];
  for (let age = BASE_CLAIM_AGE; age <= MAX_CLAIM_AGE; age += 1) {
    const years = age - BASE_CLAIM_AGE;
    const monthly = baseMonthly * Math.pow(1 + BENEFIT_GROWTH_RATE, years);
    rows.push({ age, monthly });
  }
  return rows;
};

const monthlyPaymentAtTime = (baseMonthly, monthsSinceClaim, colaAnnual) => {
  if (colaAnnual <= 0) return baseMonthly;
  const years = Math.floor(monthsSinceClaim / 12);
  return baseMonthly * Math.pow(1 + colaAnnual, years);
};

const totalAtThroughAge = ({ claimAge, monthly }, startAge, throughAge, colaAnnual, interestAnnual, taxRate) => {
  const startMonth = Math.round(startAge * 12);
  const endMonth = Math.round(throughAge * 12);
  const claimMonth = Math.round(claimAge * 12);

  const rMonthly = interestAnnual > 0 ? Math.pow(1 + interestAnnual, 1 / 12) - 1 : 0;

  let balance = 0;
  for (let month = startMonth; month < endMonth; month += 1) {
    if (rMonthly > 0) {
      balance *= 1 + rMonthly;
    }
    if (month >= claimMonth) {
      const monthsSinceClaim = month - claimMonth;
      const payment = monthlyPaymentAtTime(monthly, monthsSinceClaim, colaAnnual);
      balance += payment * (1 - taxRate);
    }
  }
  return balance;
};

const balanceSeries = (option, startAge, maxAge, colaAnnual, interestAnnual, taxRate) => {
  const startMonth = Math.round(startAge * 12);
  const endMonth = Math.round(maxAge * 12);
  const claimMonth = Math.round(option.claimAge * 12);
  const rMonthly = interestAnnual > 0 ? Math.pow(1 + interestAnnual, 1 / 12) - 1 : 0;

  const ages = [];
  const balances = [];
  let balance = 0;

  for (let t = startMonth; t <= endMonth; t += 1) {
    if (t > startMonth) {
      const month = t - 1;
      if (rMonthly > 0) {
        balance *= 1 + rMonthly;
      }

      if (month >= claimMonth) {
        const monthsSinceClaim = month - claimMonth;
        const payment = monthlyPaymentAtTime(option.monthly, monthsSinceClaim, colaAnnual);
        balance += payment * (1 - taxRate);
      }
    }

    ages.push(t / 12);
    balances.push(balance);
  }

  return { ages, balances };
};

const breakEvenAge = (optionA, optionB, startAge, maxAge, colaAnnual, interestAnnual, taxRate) => {
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

const renderTable = (rows) => {
  tableRoot.innerHTML = "";
  const header = document.createElement("div");
  header.className = "table-row table-header";

  const headerAge = document.createElement("span");
  headerAge.textContent = "Age";

  const headerMonthly = document.createElement("span");
  headerMonthly.textContent = "Monthly benefit";

  header.append(headerAge, headerMonthly);
  tableRoot.appendChild(header);

  rows.forEach((row) => {
    const wrapper = document.createElement("div");
    wrapper.className = "table-row";

    const ageValue = document.createElement("span");
    ageValue.className = "table-value";
    ageValue.textContent = row.age;

    const monthlyValue = document.createElement("span");
    monthlyValue.className = "table-value";
    monthlyValue.textContent = `$${formatMoney(row.monthly)}/mo`;

    wrapper.append(ageValue, monthlyValue);
    tableRoot.appendChild(wrapper);
  });
};

const buildOptions = (baseMonthly) => {
  if (baseMonthly === null || baseMonthly <= 0) {
    tableError.textContent = "Enter a valid monthly benefit at age 62.";
    return null;
  }

  tableError.textContent = "";
  return buildBenefitRowsFromBase(baseMonthly).map((row) => ({ claimAge: row.age, monthly: row.monthly }));
};

const updateSelects = (options) => {
  const buildOption = (value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    return option;
  };

  const selectedA = claimSelectA.value;
  const selectedB = claimSelectB.value;
  const hadSelectedA = Boolean(selectedA);
  const hadSelectedB = Boolean(selectedB);

  claimSelectA.innerHTML = "";
  claimSelectB.innerHTML = "";

  options.forEach((option) => {
    claimSelectA.appendChild(buildOption(option.claimAge));
    claimSelectB.appendChild(buildOption(option.claimAge));
  });

  if (hadSelectedA) claimSelectA.value = selectedA;
  if (hadSelectedB) claimSelectB.value = selectedB;

  if (!hadSelectedA && options[0]) claimSelectA.value = options[0].claimAge;
  if (!hadSelectedB) {
    const defaultB = options.find((option) => option.claimAge === MAX_CLAIM_AGE);
    if (defaultB) {
      claimSelectB.value = defaultB.claimAge;
    } else if (options[1]) {
      claimSelectB.value = options[1].claimAge;
    } else if (options[0]) {
      claimSelectB.value = options[0].claimAge;
    }
  }
};

const updateTotalsTable = (rows, throughAge) => {
  totalsTable.innerHTML = "";
  if (!rows.length) return;

  const best = rows[0];
  rows.forEach((row) => {
    const wrapper = document.createElement("div");
    wrapper.className = "result-row";
    if (row === best) wrapper.classList.add("best");

    const age = document.createElement("span");
    age.textContent = `Claim ${row.claimAge}`;

    const monthly = document.createElement("span");
    monthly.textContent = `$${formatMoney(row.monthly)}/mo`;

    const total = document.createElement("span");
    total.textContent = `$${formatMoney(row.total)} by age ${throughAge}`;

    wrapper.append(age, monthly, total);
    totalsTable.appendChild(wrapper);
  });
};

const updateHeroStats = (breakEven, bestRow, maxGap) => {
  if (!heroBreakEven || !heroBest || !heroGap) return;
  heroBreakEven.textContent = breakEven ? `~${breakEven.toFixed(1)} yrs` : "--";
  heroBest.textContent = bestRow ? `Claim ${bestRow.claimAge}` : "--";
  heroGap.textContent = maxGap ? `$${formatMoney(maxGap)}` : "--";
};

const updateBreakEvenPanel = (breakEven, optionA, optionB) => {
  const value = breakEven ? `~${breakEven.toFixed(1)} years` : "No break-even found";
  const subtitle = breakEven
    ? `Claim ${optionB.claimAge} overtakes claim ${optionA.claimAge} at this age.`
    : `No crossover before your max age.`;

  breakEvenResult.querySelector(".result-value").textContent = value;
  breakEvenResult.querySelector(".result-sub").textContent = subtitle;
};

const renderBreakEvenChart = (optionA, optionB, startAge, maxAge, cola, interest, tax, breakEven) => {
  const svgWidth = 360;
  const svgHeight = 160;
  const padding = 10;

  const seriesA = balanceSeries(optionA, startAge, maxAge, cola, interest, tax);
  const seriesB = balanceSeries(optionB, startAge, maxAge, cola, interest, tax);

  const sampleEvery = 12;
  const sample = (series) =>
    series.ages
      .filter((_, index) => index % sampleEvery === 0)
      .map((age, index) => ({
        age,
        value: series.balances[index * sampleEvery],
      }));

  const pointsA = sample(seriesA);
  const pointsB = sample(seriesB);

  if (!pointsA.length || !pointsB.length) {
    clearBreakEvenChart();
    return;
  }

  const allValues = [...pointsA, ...pointsB].map((point) => point.value);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);

  const scaleX = (age) =>
    padding + ((age - startAge) / (maxAge - startAge || 1)) * (svgWidth - padding * 2);
  const scaleY = (value) =>
    svgHeight - padding - ((value - minValue) / (maxValue - minValue || 1)) * (svgHeight - padding * 2);

  const buildPath = (points) =>
    points
      .map((point, index) => {
        const x = scaleX(point.age);
        const y = scaleY(point.value);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  chartPathA.setAttribute("d", buildPath(pointsA));
  chartPathB.setAttribute("d", buildPath(pointsB));

  if (breakEven) {
    const x = scaleX(breakEven);
    chartCross.setAttribute("x1", x.toFixed(2));
    chartCross.setAttribute("x2", x.toFixed(2));
    chartCross.setAttribute("y1", padding.toString());
    chartCross.setAttribute("y2", (svgHeight - padding).toString());
    chartCross.style.opacity = "1";
  } else {
    chartCross.style.opacity = "0";
  }

  legendA.textContent = `Claim ${optionA.claimAge}`;
  legendB.textContent = `Claim ${optionB.claimAge}`;

  chartState = {
    optionA,
    optionB,
    startAge,
    maxAge,
    padding,
    svgWidth,
    svgHeight,
    seriesA,
    seriesB,
    minValue,
    maxValue,
  };
};

const clearBreakEvenChart = () => {
  chartPathA.setAttribute("d", "");
  chartPathB.setAttribute("d", "");
  chartCross.style.opacity = "0";
  chartHover.style.opacity = "0";
  chartTooltip.style.opacity = "0";
  legendA.textContent = "Claim A";
  legendB.textContent = "Claim B";
  chartState = null;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateChartHover = (clientX) => {
  if (!chartState) return;

  const { optionA, optionB, startAge, maxAge, padding, svgWidth, svgHeight, seriesA, seriesB } = chartState;
  const rect = chartSvg.getBoundingClientRect();
  const localX = clamp(clientX - rect.left, 0, rect.width);
  const pixelPadding = rect.width * (padding / svgWidth);
  const percent = clamp((localX - pixelPadding) / (rect.width - pixelPadding * 2 || 1), 0, 1);
  const rawAge = startAge + percent * (maxAge - startAge);
  const snappedAge = clamp(Math.round(rawAge), Math.ceil(startAge), Math.floor(maxAge));

  const startMonth = Math.round(startAge * 12);
  const snappedMonth = Math.round(snappedAge * 12);
  const index = clamp(snappedMonth - startMonth, 0, seriesA.ages.length - 1);

  const valueA = seriesA.balances[index];
  const valueB = seriesB.balances[index];
  const diff = Math.abs(valueA - valueB);

  const scaleX = (age) =>
    padding + ((age - startAge) / (maxAge - startAge || 1)) * (svgWidth - padding * 2);

  const lineX = scaleX(snappedAge);
  chartHover.setAttribute("x1", lineX.toFixed(2));
  chartHover.setAttribute("x2", lineX.toFixed(2));
  chartHover.setAttribute("y1", padding.toString());
  chartHover.setAttribute("y2", (svgHeight - padding).toString());
  chartHover.style.opacity = "1";

  chartTooltip.textContent = `Age: ${snappedAge}\nClaim ${optionA.claimAge}: $${formatMoney(valueA)}\nClaim ${optionB.claimAge}: $${formatMoney(valueB)}\nTop vs bottom diff: $${formatMoney(diff)}`;
  chartTooltip.style.opacity = "1";
};

chartSvg.addEventListener("mousemove", (event) => {
  updateChartHover(event.clientX);
});

chartSvg.addEventListener("mouseleave", () => {
  chartHover.style.opacity = "0";
  chartTooltip.style.opacity = "0";
});

const update = () => {
  const baseMonthly = parseCurrency(inputs.baseBenefit.value);
  const rows = baseMonthly && baseMonthly > 0 ? buildBenefitRowsFromBase(baseMonthly) : [];
  renderTable(rows);

  const options = buildOptions(baseMonthly);
  if (!options) {
    totalsTable.innerHTML = "";
    breakEvenResult.querySelector(".result-value").textContent = "--";
    breakEvenResult.querySelector(".result-sub").textContent = "Fix the benefit table to continue.";
    updateHeroStats(null, null, null);
    clearBreakEvenChart();
    return;
  }

  updateSelects(options);

  const startAge = parseNumber(inputs.startAge.value) ?? BASE_CLAIM_AGE;
  const throughAge = parseNumber(inputs.throughAge.value) ?? 85;
  const maxAge = parseNumber(inputs.maxAge.value) ?? 100;
  const cola = (parseNumber(inputs.cola.value) ?? 0) / 100;
  const interest = (parseNumber(inputs.interest.value) ?? 0) / 100;
  const tax = 0;

  const totals = options.map((option) => ({
    ...option,
    total: totalAtThroughAge(option, startAge, throughAge, cola, interest, tax),
  }));

  totals.sort((a, b) => b.total - a.total);

  updateTotalsTable(totals, throughAge);

  const maxGap = totals.length > 1 ? totals[0].total - totals[totals.length - 1].total : null;

  const optionA = options.find((opt) => String(opt.claimAge) === claimSelectA.value) ?? options[0];
  const optionB = options.find((opt) => String(opt.claimAge) === claimSelectB.value) ?? options[1];

  if (optionA && optionB && optionA.claimAge !== optionB.claimAge) {
    const breakEven = breakEvenAge(optionA, optionB, startAge, maxAge, cola, interest, tax);
    updateBreakEvenPanel(breakEven, optionA, optionB);
    updateHeroStats(breakEven, totals[0], maxGap);
    renderBreakEvenChart(optionA, optionB, startAge, maxAge, cola, interest, tax, breakEven);
  } else {
    breakEvenResult.querySelector(".result-value").textContent = "Pick two ages";
    breakEvenResult.querySelector(".result-sub").textContent = "Select different claim ages.";
    updateHeroStats(null, totals[0], maxGap);
    clearBreakEvenChart();
  }
};

const formatBaseBenefitInput = () => {
  const parsed = parseCurrency(inputs.baseBenefit.value);
  if (parsed === null) return;
  inputs.baseBenefit.value = formatCurrency(parsed);
};

resetTableButton.addEventListener("click", () => {
  inputs.baseBenefit.value = formatCurrency(DEFAULT_BASE_BENEFIT);
  inputs.startAge.value = "62";
  inputs.throughAge.value = "85";
  inputs.maxAge.value = "100";
  inputs.cola.value = "2";
  inputs.interest.value = "4";
  update();
});

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", () => update());
});

inputs.baseBenefit.addEventListener("blur", formatBaseBenefitInput);

claimSelectA.addEventListener("change", () => update());
claimSelectB.addEventListener("change", () => update());

formatBaseBenefitInput();
update();
