const WEIGHTS = {
  capital: 0.35,
  industry: 0.25,
  earnings: 0.25,
  sentiment: 0.15,
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function weightedScore(signals) {
  return clampScore(
    Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
      return sum + clampScore(signals[key]?.score) * weight;
    }, 0)
  );
}

function classifyStage(signals) {
  if (clampScore(signals.sentiment?.score) >= 72) return "情绪扩散";
  if (clampScore(signals.earnings?.score) >= 72) return "财报验证";
  if (clampScore(signals.industry?.score) >= 72) return "产业强化";
  if (clampScore(signals.capital?.score) >= 72) return "资金先动";
  return "等待触发";
}

function classifyStatus(signals) {
  const score = weightedScore(signals);
  const capital = clampScore(signals.capital?.score);
  const industry = clampScore(signals.industry?.score);
  const earnings = clampScore(signals.earnings?.score);

  if (score >= 84 && capital >= 80 && industry >= 75 && earnings >= 72) return "critical";
  if (score >= 70) return "watch";
  return "quiet";
}

function enrichAsset(asset) {
  const score = weightedScore(asset.signals);
  const stage = classifyStage(asset.signals);
  const status = classifyStatus(asset.signals);

  return {
    ...asset,
    score,
    stage,
    status,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  WEIGHTS,
  classifyStage,
  classifyStatus,
  enrichAsset,
  weightedScore,
};
