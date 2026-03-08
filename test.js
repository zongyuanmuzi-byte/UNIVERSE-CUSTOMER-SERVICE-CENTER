import { estimateLifeCountdown } from "./lifeCountdown.js";

const userInput = {
  birthDate: "1995-06-18",
  sex: "male",

  heightCm: 175,
  weightKg: 74,

  smokingStatus: "current",
  cigarettesPerDay: 8,
  smokingYears: 10,
  quitYears: 0,

  drinkingDaysPerWeek: 2,
  drinksPerDrinkingDay: 3,
  binge: false,

  motherAgeAttained: 78,
  fatherAgeAttained: 82,
  grandparentAvgAge: 80
};

const result = estimateLifeCountdown(userInput);

console.log("计算结果：");
console.log(result);