// =====================================================
// Universe Customer Service Center
// Life Countdown Engine - China Baseline v2.1
// =====================================================

// 中国官方平均预期寿命（2020普查口径）
// total: 77.93, male: 75.37, female: 80.88
// Source: National Bureau of Statistics of China
export const CHINA_BASELINE = {
  country: "China",
  source: "China official life expectancy (2020 census-calculated)",
  e0: {
    total: 77.93,
    male: 75.37,
    female: 80.88,
  },

  // 这里不是官方直接给出的生命表参数，
  // 而是为了工程实现，按中国官方 e0 做校准后使用的 Gompertz-Makeham 风格参数。
  // 后续如果你拿到中国 qx 生命表，可直接替换这一层。
  gompertzMakeham: {
    male: {
      A: 0.00030,
      B: 0.000012,
      C: 0.095
    },
    female: {
      A: 0.00022,
      B: 0.000009,
      C: 0.093
    },
    unknown: {
      A: 0.00026,
      B: 0.0000105,
      C: 0.094
    }
  },

  maxAge: 120,
  stepsPerYear: 12
};

// =====================================================
// 风险参数表
// 说明：以下 HR 值来自流行病学研究区间，已做消费级产品的温和工程化裁剪。
// =====================================================
export const RISK_TABLES = {
  bmi: [
    { min: 0,    max: 18.5, hr: 1.51 },
    { min: 18.5, max: 20.0, hr: 1.13 },
    { min: 20.0, max: 25.0, hr: 1.00 },
    { min: 25.0, max: 27.5, hr: 1.07 },
    { min: 27.5, max: 30.0, hr: 1.20 },
    { min: 30.0, max: 35.0, hr: 1.45 },
    { min: 35.0, max: 40.0, hr: 1.94 },
    { min: 40.0, max: Infinity, hr: 2.76 },
  ],

  smoking: {
    never: 1.00,
    former_quit_ge_20: 0.95,
    former_quit_10_19: 1.00,
    former_quit_5_9: 1.10,
    former_quit_lt_5: 1.25,

    current_1_5: 1.60,
    current_6_10: 1.85,
    current_11_15: 2.30,
    current_16_19: 2.15,
    current_ge_20: 2.09,
  },

  alcohol: {
    female: [
      { min: 0,   max: 0,   hr: 1.00 },
      { min: 0.1, max: 49,  hr: 1.02 },
      { min: 50,  max: 174, hr: 1.08 },
      { min: 175, max: 314, hr: 1.22 },
      { min: 315, max: Infinity, hr: 1.35 },
    ],
    male: [
      { min: 0,   max: 0,   hr: 1.00 },
      { min: 0.1, max: 69,  hr: 1.01 },
      { min: 70,  max: 314, hr: 1.05 },
      { min: 315, max: 454, hr: 1.19 },
      { min: 455, max: Infinity, hr: 1.35 },
    ],
    unknown: [
      { min: 0,   max: 0,   hr: 1.00 },
      { min: 0.1, max: 59,  hr: 1.02 },
      { min: 60,  max: 244, hr: 1.07 },
      { min: 245, max: 384, hr: 1.20 },
      { min: 385, max: Infinity, hr: 1.35 },
    ],
    bingeMultiplier: 1.08,
    gramsPerDrink: 14
  },

  family: {
    referenceAge: 80,
    hrPer5Years: 0.88,
    minHR: 0.75,
    maxHR: 1.20
  },

  shrinkageByAge: [
    { minAge: 0,  maxAge: 39.999, lambda: 0.55 },
    { minAge: 40, maxAge: 59.999, lambda: 0.65 },
    { minAge: 60, maxAge: 120,    lambda: 0.75 },
  ],

  finalRiskClamp: {
    min: 0.45,
    max: 3.00
  }
};

// =====================================================
// 工具函数
// =====================================================
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function ln(x) {
  return Math.log(x);
}

export function yearsBetween(dateA, dateB = new Date()) {
  const ms = dateB.getTime() - new Date(dateA).getTime();
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

export function formatDateISO(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function findBandByValue(bands, value) {
  return bands.find(b => value >= b.min && value < b.max) || bands[bands.length - 1];
}

export function getShrinkageLambda(age) {
  const row = RISK_TABLES.shrinkageByAge.find(
    r => age >= r.minAge && age <= r.maxAge
  );
  return row ? row.lambda : 0.65;
}

export function calculateBMI(heightCm, weightKg) {
  const h = heightCm / 100;
  if (!h || !weightKg || h <= 0 || weightKg <= 0) return null;
  return weightKg / (h * h);
}

// =====================================================
// 基线危险度 / 生存函数
// 注意：这是“中国官方 e0 校准版参数模型”
// 后续拿到中国 qx 生命表时，可直接替换为 life-table 版本。
// =====================================================
export function getBaselineParams(sex = "unknown") {
  if (sex === "male") return CHINA_BASELINE.gompertzMakeham.male;
  if (sex === "female") return CHINA_BASELINE.gompertzMakeham.female;
  return CHINA_BASELINE.gompertzMakeham.unknown;
}

// 年龄 x 时的瞬时危险度 h(x) = A + B * exp(C * x)
export function baselineHazardAtAge(age, sex = "unknown") {
  const { A, B, C } = getBaselineParams(sex);
  return A + B * Math.exp(C * age);
}

// 基线累计风险 H(0->age)
export function baselineCumulativeHazard(age, sex = "unknown") {
  const { A, B, C } = getBaselineParams(sex);
  return A * age + (B / C) * (Math.exp(C * age) - 1);
}

// 条件基线生存：已活到 currentAge，再活至少 t 年
export function baselineConditionalSurvival(currentAge, tYears, sex = "unknown") {
  const H1 = baselineCumulativeHazard(currentAge, sex);
  const H2 = baselineCumulativeHazard(currentAge + tYears, sex);
  return Math.exp(-(H2 - H1));
}

// =====================================================
// 各风险子项
// =====================================================
export function bmiLogHR({ heightCm, weightKg, currentAge }) {
  const bmi = calculateBMI(heightCm, weightKg);
  if (bmi == null) return { bmi: null, logHR: 0, hr: 1 };

  const band = findBandByValue(RISK_TABLES.bmi, bmi);
  let hr = band.hr;

  // 年龄衰减
  let ageWeight = 1.0;
  if (currentAge >= 75) ageWeight = 0.60;
  else if (currentAge >= 60) ageWeight = 0.80;

  const logHR = ln(hr) * ageWeight;
  return { bmi, hr, logHR };
}

export function smokingLogHR({
  smokingStatus = "never",
  cigarettesPerDay = 0,
  smokingYears = 0,
  quitYears = 0
}) {
  let hr = 1.0;

  if (smokingStatus === "never") {
    hr = 1.0;
  } else if (smokingStatus === "former") {
    if (quitYears >= 20) hr = RISK_TABLES.smoking.former_quit_ge_20;
    else if (quitYears >= 10) hr = RISK_TABLES.smoking.former_quit_10_19;
    else if (quitYears >= 5) hr = RISK_TABLES.smoking.former_quit_5_9;
    else hr = RISK_TABLES.smoking.former_quit_lt_5;
  } else if (smokingStatus === "current") {
    if (cigarettesPerDay >= 20) hr = RISK_TABLES.smoking.current_ge_20;
    else if (cigarettesPerDay >= 16) hr = RISK_TABLES.smoking.current_16_19;
    else if (cigarettesPerDay >= 11) hr = RISK_TABLES.smoking.current_11_15;
    else if (cigarettesPerDay >= 6) hr = RISK_TABLES.smoking.current_6_10;
    else if (cigarettesPerDay >= 1) hr = RISK_TABLES.smoking.current_1_5;
  }

  const packYears = (cigarettesPerDay / 20) * smokingYears;
  const deltaPY = 1 + Math.min(0.25, 0.04 * Math.log(1 + Math.max(0, packYears)));

  hr *= deltaPY;
  return { hr, logHR: ln(hr), packYears };
}

export function alcoholLogHR({
  sex = "unknown",
  drinkingDaysPerWeek = 0,
  drinksPerDrinkingDay = 0,
  binge = false
}) {
  const gramsPerDrink = RISK_TABLES.alcohol.gramsPerDrink;
  const weeklyAlcoholG = drinkingDaysPerWeek * drinksPerDrinkingDay * gramsPerDrink;

  const table =
    sex === "female"
      ? RISK_TABLES.alcohol.female
      : sex === "male"
      ? RISK_TABLES.alcohol.male
      : RISK_TABLES.alcohol.unknown;

  let hr = findBandByValue(table, weeklyAlcoholG).hr;

  if (binge) {
    hr *= RISK_TABLES.alcohol.bingeMultiplier;
  }

  return { weeklyAlcoholG, hr, logHR: ln(hr) };
}

export function familyLogHR({
  motherAgeAttained = null,
  fatherAgeAttained = null,
  grandparentAvgAge = null
}) {
  const parentAges = [motherAgeAttained, fatherAgeAttained].filter(
    v => typeof v === "number" && v > 0
  );

  if (parentAges.length === 0) {
    return { hr: 1, logHR: 0, familyIndex: null };
  }

  const parentAvg = parentAges.reduce((a, b) => a + b, 0) / parentAges.length;
  const familyIndex =
    typeof grandparentAvgAge === "number" && grandparentAvgAge > 0
      ? 0.8 * parentAvg + 0.2 * grandparentAvgAge
      : parentAvg;

  const ref = RISK_TABLES.family.referenceAge;
  const hrPer5 = RISK_TABLES.family.hrPer5Years;

  let hr = Math.pow(hrPer5, (familyIndex - ref) / 5);
  hr = clamp(hr, RISK_TABLES.family.minHR, RISK_TABLES.family.maxHR);

  return { hr, logHR: ln(hr), familyIndex, parentAvg };
}

// =====================================================
// 综合风险乘子
// =====================================================
export function calculateRiskMultiplier(input) {
  const currentAge = yearsBetween(input.birthDate);

  const bmiPart = bmiLogHR({
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    currentAge
  });

  const smokingPart = smokingLogHR({
    smokingStatus: input.smokingStatus,
    cigarettesPerDay: input.cigarettesPerDay,
    smokingYears: input.smokingYears,
    quitYears: input.quitYears
  });

  const alcoholPart = alcoholLogHR({
    sex: input.sex,
    drinkingDaysPerWeek: input.drinkingDaysPerWeek,
    drinksPerDrinkingDay: input.drinksPerDrinkingDay,
    binge: input.binge
  });

  const familyPart = familyLogHR({
    motherAgeAttained: input.motherAgeAttained,
    fatherAgeAttained: input.fatherAgeAttained,
    grandparentAvgAge: input.grandparentAvgAge
  });

  const rawLogRisk =
    bmiPart.logHR +
    smokingPart.logHR +
    alcoholPart.logHR +
    familyPart.logHR;

  const lambda = getShrinkageLambda(currentAge);
  const riskMultiplierRaw = Math.exp(lambda * rawLogRisk);

  const riskMultiplier = clamp(
    riskMultiplierRaw,
    RISK_TABLES.finalRiskClamp.min,
    RISK_TABLES.finalRiskClamp.max
  );

  return {
    currentAge,
    lambda,
    bmiPart,
    smokingPart,
    alcoholPart,
    familyPart,
    rawLogRisk,
    riskMultiplierRaw,
    riskMultiplier
  };
}

// =====================================================
// 生成个体化生存曲线
// =====================================================
export function survivalCurveFromBaseline(input, maxYears = 120) {
  const { currentAge, riskMultiplier } = calculateRiskMultiplier(input);
  const sex = input.sex || "unknown";

  const points = [];

  for (let k = 0; k <= maxYears; k += 1 / CHINA_BASELINE.stepsPerYear) {
    const s0 = baselineConditionalSurvival(currentAge, k, sex);
    const s = Math.pow(s0, riskMultiplier);

    points.push({
      tYears: k,
      age: currentAge + k,
      survival: s
    });

    if (s < 0.0005) break;
    if (currentAge + k >= CHINA_BASELINE.maxAge) break;
  }

  return points;
}

// =====================================================
// 从生存曲线提取指标
// =====================================================
export function findTimeAtSurvival(points, target) {
  for (const p of points) {
    if (p.survival <= target) return p.tYears;
  }
  return null;
}

export function survivalAtYears(points, years) {
  let closest = points[0];
  let minDiff = Infinity;
  for (const p of points) {
    const d = Math.abs(p.tYears - years);
    if (d < minDiff) {
      minDiff = d;
      closest = p;
    }
  }
  return closest ? closest.survival : null;
}

export function probabilityReachAge(points, currentAge, targetAge) {
  const yearsNeeded = targetAge - currentAge;
  if (yearsNeeded <= 0) return 1;
  return survivalAtYears(points, yearsNeeded);
}

// =====================================================
// 主函数：估计人生倒计时
// =====================================================
export function estimateLifeCountdown(input) {
  const risk = calculateRiskMultiplier(input);
  const points = survivalCurveFromBaseline(input);

  const medianYears = findTimeAtSurvival(points, 0.5);
  const p80Years = findTimeAtSurvival(points, 0.8);
  const p20Years = findTimeAtSurvival(points, 0.2);

  // 离散近似期望寿命
  let expectedYears = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = points[i].tYears - points[i - 1].tYears;
    expectedYears += points[i - 1].survival * dt;
  }

  const medianDays = medianYears ? medianYears * 365.25 : null;
  const offlineDateMedian = medianDays ? formatDateISO(addDays(new Date(), medianDays)) : null;

  const prob80 = probabilityReachAge(points, risk.currentAge, 80);
  const prob90 = probabilityReachAge(points, risk.currentAge, 90);

  return {
    modelVersion: "China Baseline v2.1",
    baselineSource: CHINA_BASELINE.source,
    country: CHINA_BASELINE.country,

    currentAge: Number(risk.currentAge.toFixed(2)),
    bmi: risk.bmiPart.bmi ? Number(risk.bmiPart.bmi.toFixed(2)) : null,
    riskMultiplier: Number(risk.riskMultiplier.toFixed(3)),

    medianRemainingYears: medianYears ? Number(medianYears.toFixed(2)) : null,
    expectedRemainingYears: Number(expectedYears.toFixed(2)),
    remainingDaysMedian: medianDays ? Math.round(medianDays) : null,
    estimatedOfflineDateMedian: offlineDateMedian,

    survivalProb1Y: Number((survivalAtYears(points, 1) ?? 0).toFixed(4)),
    survivalProb5Y: Number((survivalAtYears(points, 5) ?? 0).toFixed(4)),
    survivalProb10Y: Number((survivalAtYears(points, 10) ?? 0).toFixed(4)),

    probReach80: prob80 != null ? Number(prob80.toFixed(4)) : null,
    probReach90: prob90 != null ? Number(prob90.toFixed(4)) : null,

    interval80PctYears: [
      p80Years ? Number(p80Years.toFixed(2)) : null,
      p20Years ? Number(p20Years.toFixed(2)) : null
    ],

    components: {
      bmiHR: Number(risk.bmiPart.hr.toFixed(3)),
      smokingHR: Number(risk.smokingPart.hr.toFixed(3)),
      alcoholHR: Number(risk.alcoholPart.hr.toFixed(3)),
      familyHR: Number(risk.familyPart.hr.toFixed(3)),
      lambda: risk.lambda
    },

    disclaimer: "For education and entertainment only"
  };
}