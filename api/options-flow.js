function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function daysUntil(dateText) {
  const expiration = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(expiration.getTime())) return 0;
  return Math.ceil((expiration.getTime() - Date.now()) / 86400000);
}

async function fetchPolygonOptionSnapshot(symbol) {
  if (!process.env.POLYGON_API_KEY) {
    throw new Error("POLYGON_API_KEY is not configured in Vercel Environment Variables.");
  }

  const url = `https://api.polygon.io/v3/snapshot/options/${encodeURIComponent(symbol)}?limit=250&apiKey=${process.env.POLYGON_API_KEY}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    const error = new Error(`Polygon request failed: ${response.status}`);
    error.status = response.status;
    error.detail = detail.slice(0, 500);
    throw error;
  }

  return response.json();
}

function summarizeOptions(payload) {
  const contracts = Array.isArray(payload?.results) ? payload.results : [];
  let totalOpenInterest = 0;
  let callOpenInterest = 0;
  let putOpenInterest = 0;
  let leapCallOpenInterest = 0;
  let gammaExposure = 0;
  let ivSum = 0;
  let ivCount = 0;

  for (const contract of contracts) {
    const details = contract.details || {};
    const oi = toNumber(contract.open_interest);
    const gamma = toNumber(contract.greeks?.gamma);
    const iv = toNumber(contract.implied_volatility);
    const type = details.contract_type;
    const days = daysUntil(details.expiration_date);
    const underlyingPrice = toNumber(contract.underlying_asset?.price);

    totalOpenInterest += oi;
    if (type === "call") callOpenInterest += oi;
    if (type === "put") putOpenInterest += oi;
    if (type === "call" && days >= 180) leapCallOpenInterest += oi;
    if (gamma && oi && underlyingPrice) gammaExposure += gamma * oi * 100 * underlyingPrice;
    if (iv) {
      ivSum += iv;
      ivCount += 1;
    }
  }

  return {
    totalOpenInterest,
    callOpenInterest,
    putOpenInterest,
    leapCallOpenInterest,
    putCallOiRatio: callOpenInterest > 0 ? putOpenInterest / callOpenInterest : null,
    gammaExposure,
    averageIv: ivCount > 0 ? ivSum / ivCount : null,
    contractsScanned: contracts.length,
  };
}

function scoreFlow(metrics) {
  let score = 40;
  if (metrics.totalOpenInterest > 0) score += Math.min(18, Math.log10(metrics.totalOpenInterest + 1) * 3);
  if (metrics.leapCallOpenInterest > 0) score += Math.min(18, Math.log10(metrics.leapCallOpenInterest + 1) * 4);
  if (metrics.gammaExposure) score += Math.min(12, Math.max(0, Math.log10(Math.abs(metrics.gammaExposure) + 1) - 4));
  if (metrics.putCallOiRatio !== null && metrics.putCallOiRatio < 0.8) score += 6;
  if (metrics.averageIv !== null && metrics.averageIv > 0.45) score += 6;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function buildEvidence(metrics) {
  const evidence = [];
  evidence.push(`当前期权总 OI: ${Math.round(metrics.totalOpenInterest).toLocaleString("en-US")}`);
  evidence.push(`LEAP Call OI: ${Math.round(metrics.leapCallOpenInterest).toLocaleString("en-US")}`);
  evidence.push(
    metrics.putCallOiRatio === null
      ? "Put/Call OI Ratio: 暂无"
      : `Put/Call OI Ratio: ${metrics.putCallOiRatio.toFixed(2)}`
  );
  evidence.push(`Gamma Exposure 估算: ${Math.round(metrics.gammaExposure).toLocaleString("en-US")}`);
  evidence.push(metrics.averageIv === null ? "平均 IV: 暂无" : `平均 IV: ${(metrics.averageIv * 100).toFixed(1)}%`);
  evidence.push("OI 增长需要保存历史快照后计算，本版本先展示当前 OI 截面。");
  return evidence;
}

module.exports = async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").trim().toUpperCase();

  if (!symbol) {
    res.status(400).json({ ok: false, error: "Missing symbol." });
    return;
  }

  try {
    const payload = await fetchPolygonOptionSnapshot(symbol);
    const metrics = summarizeOptions(payload);

    res.status(200).json({
      ok: true,
      symbol,
      generatedAt: new Date().toISOString(),
      metrics,
      score: scoreFlow(metrics),
      evidence: buildEvidence(metrics),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      symbol,
      error: error.message || "Options flow query failed.",
      hint:
        error.status === 403
          ? "Polygon returned 403. Your API key likely does not have Options Snapshot access for this endpoint/plan."
          : "Check POLYGON_API_KEY and Polygon endpoint availability.",
      detail: error.detail || null,
    });
  }
};
