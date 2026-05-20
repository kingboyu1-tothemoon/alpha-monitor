const TRADIER_BASE_URL = process.env.TRADIER_BASE_URL || "https://api.tradier.com/v1";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function daysUntil(dateText) {
  const expiration = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(expiration.getTime())) return 0;
  return Math.ceil((expiration.getTime() - Date.now()) / 86400000);
}

async function fetchTradier(path) {
  if (!process.env.TRADIER_TOKEN) {
    throw new Error("TRADIER_TOKEN is not configured in Vercel Environment Variables.");
  }

  const response = await fetch(`${TRADIER_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.TRADIER_TOKEN}`,
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    const error = new Error(`Tradier request failed: ${response.status}`);
    error.status = response.status;
    error.detail = detail.slice(0, 500);
    throw error;
  }

  return response.json();
}

async function fetchExpirations(symbol) {
  const payload = await fetchTradier(`/markets/options/expirations?symbol=${encodeURIComponent(symbol)}`);
  return asArray(payload?.expirations?.date).filter(Boolean);
}

async function fetchUnderlyingQuote(symbol) {
  const payload = await fetchTradier(`/markets/quotes?symbols=${encodeURIComponent(symbol)}`);
  const quote = asArray(payload?.quotes?.quote)[0];
  return toNumber(quote?.last ?? quote?.close ?? quote?.prevclose);
}

function chooseExpirations(expirations) {
  const sorted = [...expirations].sort();
  const nearTerm = sorted.slice(0, 8);
  const leaps = sorted.filter((date) => daysUntil(date) >= 180).slice(0, 8);
  return [...new Set([...nearTerm, ...leaps])].slice(0, 16);
}

async function fetchChain(symbol, expiration) {
  const payload = await fetchTradier(
    `/markets/options/chains?symbol=${encodeURIComponent(symbol)}&expiration=${encodeURIComponent(expiration)}&greeks=true`
  );
  return asArray(payload?.options?.option);
}

function getOptionType(option) {
  return String(option.option_type || option.type || "").toLowerCase();
}

function getOpenInterest(option) {
  return toNumber(option.open_interest ?? option.openInterest);
}

function getGamma(option) {
  return toNumber(option.greeks?.gamma);
}

function getIv(option) {
  return toNumber(option.greeks?.mid_iv ?? option.greeks?.smv_vol ?? option.implied_volatility);
}

function summarizeOptions(chains, underlyingPrice) {
  const contracts = chains.flat();
  let totalOpenInterest = 0;
  let callOpenInterest = 0;
  let putOpenInterest = 0;
  let leapCallOpenInterest = 0;
  let gammaExposure = 0;
  let ivSum = 0;
  let ivCount = 0;

  for (const option of contracts) {
    const type = getOptionType(option);
    const oi = getOpenInterest(option);
    const gamma = getGamma(option);
    const iv = getIv(option);
    const days = daysUntil(option.expiration_date);
    const contractUnderlyingPrice = toNumber(option.underlying_price ?? option.root_symbol_price) || underlyingPrice;

    totalOpenInterest += oi;
    if (type === "call") callOpenInterest += oi;
    if (type === "put") putOpenInterest += oi;
    if (type === "call" && days >= 180) leapCallOpenInterest += oi;
    if (gamma && oi && contractUnderlyingPrice) gammaExposure += gamma * oi * 100 * contractUnderlyingPrice;
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
    expirationsScanned: new Set(contracts.map((option) => option.expiration_date).filter(Boolean)).size,
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
  return [
    `当前期权总 OI: ${Math.round(metrics.totalOpenInterest).toLocaleString("en-US")}`,
    `LEAP Call OI: ${Math.round(metrics.leapCallOpenInterest).toLocaleString("en-US")}`,
    metrics.putCallOiRatio === null
      ? "Put/Call OI Ratio: 暂无"
      : `Put/Call OI Ratio: ${metrics.putCallOiRatio.toFixed(2)}`,
    `Gamma Exposure 估算: ${Math.round(metrics.gammaExposure).toLocaleString("en-US")}`,
    metrics.averageIv === null ? "平均 IV: 暂无" : `平均 IV: ${(metrics.averageIv * 100).toFixed(1)}%`,
    `扫描到期日: ${metrics.expirationsScanned}`,
    "OI 增长需要保存历史快照后计算，本版本先展示当前 OI 截面。",
  ];
}

module.exports = async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").trim().toUpperCase();

  if (!symbol) {
    res.status(400).json({ ok: false, error: "Missing symbol." });
    return;
  }

  try {
    const [allExpirations, underlyingPrice] = await Promise.all([
      fetchExpirations(symbol),
      fetchUnderlyingQuote(symbol),
    ]);
    const expirations = chooseExpirations(allExpirations);

    if (!expirations.length) {
      res.status(404).json({ ok: false, symbol, error: "No Tradier option expirations found for this symbol." });
      return;
    }

    const chains = await Promise.all(expirations.map((expiration) => fetchChain(symbol, expiration)));
    const metrics = summarizeOptions(chains, underlyingPrice);

    res.status(200).json({
      ok: true,
      provider: "Tradier",
      symbol,
      generatedAt: new Date().toISOString(),
      underlyingPrice,
      expirations,
      metrics,
      score: scoreFlow(metrics),
      evidence: buildEvidence(metrics),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      symbol,
      error: error.message || "Tradier options flow query failed.",
      hint:
        error.status === 401 || error.status === 403
          ? "Tradier rejected the request. Check TRADIER_TOKEN and account data permissions."
          : "Check TRADIER_TOKEN, symbol, and Tradier endpoint availability.",
      detail: error.detail || null,
    });
  }
};
