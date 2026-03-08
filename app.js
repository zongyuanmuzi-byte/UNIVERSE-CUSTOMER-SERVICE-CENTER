import { estimateLifeCountdown } from "./lifeCountdown.js";

let scanTimer = null;

function getNumberValue(id) {
  const el = document.getElementById(id);
  if (!el) return null;

  const value = el.value?.trim?.() ?? el.value;
  if (value === "" || value == null) return null;

  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toPercent(value) {
  if (value == null) return "--";
  return `${(value * 100).toFixed(2)}%`;
}

function updateSmokingField() {
  const smokingStatusEl = document.getElementById("smokingStatus");
  const cigarettesPerDayField = document.getElementById("cigarettesPerDayField");
  const smokingYearsField = document.getElementById("smokingYearsField");
  const quitYearsField = document.getElementById("quitYearsField");

  const cigarettesPerDayEl = document.getElementById("cigarettesPerDay");
  const smokingYearsEl = document.getElementById("smokingYears");
  const quitYearsEl = document.getElementById("quitYears");

  if (
    !smokingStatusEl ||
    !cigarettesPerDayField ||
    !smokingYearsField ||
    !quitYearsField
  ) {
    return;
  }

  const smokingStatus = smokingStatusEl.value;

  if (smokingStatus === "never") {
    cigarettesPerDayField.classList.add("hidden");
    smokingYearsField.classList.add("hidden");
    quitYearsField.classList.add("hidden");

    if (cigarettesPerDayEl) cigarettesPerDayEl.value = "";
    if (smokingYearsEl) smokingYearsEl.value = "";
    if (quitYearsEl) quitYearsEl.value = "";
  } else if (smokingStatus === "former") {
    cigarettesPerDayField.classList.remove("hidden");
    smokingYearsField.classList.remove("hidden");
    quitYearsField.classList.remove("hidden");

    if (quitYearsEl && quitYearsEl.value === "0") {
      quitYearsEl.value = "";
    }
  } else if (smokingStatus === "current") {
    cigarettesPerDayField.classList.remove("hidden");
    smokingYearsField.classList.remove("hidden");
    quitYearsField.classList.add("hidden");

    if (quitYearsEl) quitYearsEl.value = "";
  }
}

function updateParentField(type) {
  const statusEl = document.getElementById(`${type}Status`);
  const field = document.getElementById(`${type}AgeField`);
  const input = document.getElementById(`${type}AgeAttained`);
  const label = document.getElementById(`${type}AgeLabel`);
  const hint = document.getElementById(`${type}Hint`);

  if (!statusEl || !field || !input || !label || !hint) return;

  const status = statusEl.value;
  const role = type === "mother" ? "母亲" : "父亲";

  if (status === "alive") {
    field.classList.add("hidden");
    input.value = "";
    label.textContent = `${role}享年`;
    hint.textContent = `若${role}已离世，请填写其生前达到的年龄。`;
  } else {
    field.classList.remove("hidden");
    label.textContent = `${role}享年`;
    hint.textContent = `若${role}已离世，请填写其生前达到的年龄。`;
  }
}

function getInputData() {
  const motherStatus = document.getElementById("motherStatus")?.value;
  const fatherStatus = document.getElementById("fatherStatus")?.value;

  return {
    birthDate: document.getElementById("birthDate")?.value || "",
    sex: document.getElementById("sex")?.value || "unknown",

    heightCm: getNumberValue("heightCm"),
    weightKg: getNumberValue("weightKg"),

    smokingStatus: document.getElementById("smokingStatus")?.value || "never",
    cigarettesPerDay: getNumberValue("cigarettesPerDay") ?? 0,
    smokingYears: getNumberValue("smokingYears") ?? 0,
    quitYears: getNumberValue("quitYears") ?? 0,

    drinkingDaysPerWeek: getNumberValue("drinkingDaysPerWeek") ?? 0,
    drinksPerDrinkingDay: getNumberValue("drinksPerDrinkingDay") ?? 0,
    binge: document.getElementById("binge")?.value === "true",

    motherAgeAttained:
      motherStatus === "deceased" ? getNumberValue("motherAgeAttained") : null,

    fatherAgeAttained:
      fatherStatus === "deceased" ? getNumberValue("fatherAgeAttained") : null,

    grandparentAvgAge: getNumberValue("grandparentAvgAge")
  };
}

function showProgressCard() {
  const progressCard = document.getElementById("progressCard");
  const resultCard = document.getElementById("resultCard");

  if (progressCard) progressCard.classList.remove("hidden");
  if (resultCard) resultCard.classList.add("hidden");

  updateProgressUI(0, "准备中", "正在连接宇宙主机…");
}

function hideProgressCard() {
  const progressCard = document.getElementById("progressCard");
  if (progressCard) progressCard.classList.add("hidden");
}

function updateProgressUI(percent, stage, label) {
  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const progressStage = document.getElementById("progressStage");
  const progressLabel = document.getElementById("progressLabel");

  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressStage) progressStage.textContent = stage;
  if (progressLabel) progressLabel.textContent = label;
}

function getProgressMessage(percent) {
  if (percent < 20) {
    return {
      stage: "初始化",
      label: "正在连接宇宙主机…"
    };
  }
  if (percent < 40) {
    return {
      stage: "读取基线",
      label: "正在读取生命表与人口寿命基线…"
    };
  }
  if (percent < 60) {
    return {
      stage: "分析行为",
      label: "正在分析生活方式与个体风险因子…"
    };
  }
  if (percent < 80) {
    return {
      stage: "计算模型",
      label: "正在估计生存概率与时间中位点…"
    };
  }
  if (percent < 100) {
    return {
      stage: "生成结果",
      label: "正在整理宇宙客服回执…"
    };
  }
  return {
    stage: "完成",
    label: "系统检测完成"
  };
}

function runScanAnimation(onComplete) {
  let percent = 0;

  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }

  showProgressCard();

  scanTimer = setInterval(() => {
    percent += Math.floor(Math.random() * 8) + 3;
    if (percent > 100) percent = 100;

    const msg = getProgressMessage(percent);
    updateProgressUI(percent, msg.stage, msg.label);

    if (percent >= 100) {
      clearInterval(scanTimer);
      scanTimer = null;

      setTimeout(() => {
        hideProgressCard();
        onComplete();
      }, 500);
    }
  }, 180);
}

function renderResult(result) {
  const resultCard = document.getElementById("resultCard");
  if (resultCard) resultCard.classList.remove("hidden");

  const remainingDaysText = document.getElementById("remainingDaysText");
  const offlineDateText = document.getElementById("offlineDateText");
  const medianYearsText = document.getElementById("medianYearsText");
  const prob80Text = document.getElementById("prob80Text");
  const prob90Text = document.getElementById("prob90Text");
  const riskMultiplierText = document.getElementById("riskMultiplierText");
  const intervalText = document.getElementById("intervalText");
  const messageText = document.getElementById("messageText");

  if (remainingDaysText) {
    remainingDaysText.textContent =
      result.remainingDaysMedian != null
        ? `${result.remainingDaysMedian.toLocaleString()} 天`
        : "--";
  }

  if (offlineDateText) {
    offlineDateText.textContent = result.estimatedOfflineDateMedian || "--";
  }

  if (medianYearsText) {
    medianYearsText.textContent =
      result.medianRemainingYears != null
        ? `${result.medianRemainingYears} 年`
        : "--";
  }

  if (prob80Text) prob80Text.textContent = toPercent(result.probReach80);
  if (prob90Text) prob90Text.textContent = toPercent(result.probReach90);

  if (riskMultiplierText) {
    riskMultiplierText.textContent =
      result.riskMultiplier != null ? String(result.riskMultiplier) : "--";
  }

  if (intervalText) {
    if (
      result.interval80PctYears &&
      result.interval80PctYears[0] != null &&
      result.interval80PctYears[1] != null
    ) {
      intervalText.textContent = `${result.interval80PctYears[0]} - ${result.interval80PctYears[1]} 年`;
    } else {
      intervalText.textContent = "--";
    }
  }

  let message = "系统提示：这不是命运结论，而是一种温和的时间提醒。";

  if (result.riskMultiplier >= 1.4) {
    message =
      "系统提示：目前存在较明显的可优化因素。若愿意，从吸烟、饮酒、作息或体重管理开始，一点点调整，也会让轨迹发生变化。";
  } else if (result.riskMultiplier >= 1.1) {
    message =
      "系统提示：你当前有一些值得留意的地方，但未来并非一成不变。很多长期结果，往往来自持续而微小的改变。";
  } else if (result.riskMultiplier >= 0.9) {
    message =
      "系统提示：整体状态接近平均水平。认真生活，认真休息，也认真对待自己的身体。";
  } else {
    message =
      "系统提示：从模型估计看，你的当前状态优于平均值。但宇宙依旧广阔，请继续珍惜此刻。";
  }

  if (messageText) messageText.textContent = message;
}

function setButtonLoading(isLoading) {
  const btn = document.getElementById("calculateBtn");
  if (!btn) return;

  btn.disabled = isLoading;
  btn.textContent = isLoading ? "宇宙检测中…" : "开始宇宙检测";
}

function resetVisualState() {
  const resultCard = document.getElementById("resultCard");
  const progressCard = document.getElementById("progressCard");

  if (resultCard) resultCard.classList.add("hidden");
  if (progressCard) progressCard.classList.add("hidden");

  updateProgressUI(0, "准备中", "正在连接宇宙主机…");

  const remainingDaysText = document.getElementById("remainingDaysText");
  const offlineDateText = document.getElementById("offlineDateText");
  const medianYearsText = document.getElementById("medianYearsText");
  const prob80Text = document.getElementById("prob80Text");
  const prob90Text = document.getElementById("prob90Text");
  const riskMultiplierText = document.getElementById("riskMultiplierText");
  const intervalText = document.getElementById("intervalText");
  const messageText = document.getElementById("messageText");

  if (remainingDaysText) remainingDaysText.textContent = "-- 天";
  if (offlineDateText) offlineDateText.textContent = "--";
  if (medianYearsText) medianYearsText.textContent = "--";
  if (prob80Text) prob80Text.textContent = "--";
  if (prob90Text) prob90Text.textContent = "--";
  if (riskMultiplierText) riskMultiplierText.textContent = "--";
  if (intervalText) intervalText.textContent = "--";
  if (messageText) messageText.textContent = "数据仅供参考，宇宙不提供退款。";
}

function clearAllInputsForPrivacy() {
  const textInputIds = [
    "birthDate",
    "heightCm",
    "weightKg",
    "cigarettesPerDay",
    "smokingYears",
    "quitYears",
    "drinkingDaysPerWeek",
    "drinksPerDrinkingDay",
    "motherAgeAttained",
    "fatherAgeAttained",
    "grandparentAvgAge"
  ];

  textInputIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
    el.setAttribute("autocomplete", "off");
  });

  const defaultSelectValues = {
    sex: "unknown",
    smokingStatus: "never",
    binge: "false",
    motherStatus: "alive",
    fatherStatus: "alive"
  };

  Object.entries(defaultSelectValues).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value;
    el.setAttribute("autocomplete", "off");
  });

  updateSmokingField();
  updateParentField("mother");
  updateParentField("father");
  resetVisualState();
  setButtonLoading(false);
}

function bindEvents() {
  const smokingStatusEl = document.getElementById("smokingStatus");
  const motherStatusEl = document.getElementById("motherStatus");
  const fatherStatusEl = document.getElementById("fatherStatus");
  const calculateBtn = document.getElementById("calculateBtn");

  if (smokingStatusEl) {
    smokingStatusEl.addEventListener("change", updateSmokingField);
  }

  if (motherStatusEl) {
    motherStatusEl.addEventListener("change", () => updateParentField("mother"));
  }

  if (fatherStatusEl) {
    fatherStatusEl.addEventListener("change", () => updateParentField("father"));
  }

  if (calculateBtn) {
    calculateBtn.addEventListener("click", () => {
      try {
        const input = getInputData();

        if (!input.birthDate) {
          alert("请输入出生日期");
          return;
        }

        setButtonLoading(true);

        runScanAnimation(() => {
          try {
            const result = estimateLifeCountdown(input);
            console.log("计算结果：", result);
            renderResult(result);
          } catch (error) {
            console.error("详细报错：", error);
            alert("计算失败，请检查输入或查看控制台报错信息。");
          } finally {
            setButtonLoading(false);
          }
        });
      } catch (error) {
        console.error("详细报错：", error);
        setButtonLoading(false);
        alert("计算失败，请检查输入或查看控制台报错信息。");
      }
    });
  }
}

function init() {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }

  clearAllInputsForPrivacy();
  bindEvents();
}

window.addEventListener("DOMContentLoaded", init);
