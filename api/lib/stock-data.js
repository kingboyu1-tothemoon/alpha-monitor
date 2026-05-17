const {
  getFinancialModelingPrepProfile,
  getFinancialModelingPrepQuote,
  getPolygonQuote,
} = require("./providers");

const DEFAULT_SYMBOLS = ["MRVL", "VST", "CRCL", "NVDA", "TSLA"];

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeFmpQuote(payload) {
  const quote = Array.isArray(payload) ? payload[0] : payload;
  if (!quote) return null;

  return {
    price: safeNumber(quote.price),
    changePercent: safeNumber(quote.changesPercentage),
    volume: safeNumber(quote.volume),
    averageVolume: safeNumber(quote.avgVolume || quote.avgVolume10D),
    marketCap: safeNumber(quote.marketCap),
    source: "FinancialModelingPrep",
  };
}

function normalizeFmpProfile(payload) {
  const profile = Array.isArray(payload) ? payload[0] : payload;
  if (!profile) return null;

  return {
    name: profile.companyName,
    sector: profile.sector,
    industry: profile.industry,
    description: profile.description,
    source: "FinancialModelingPrep",
  };
}

function normalizePolygonPreviousClose(payload) {
  const bar = payload?.results?.[0];
  if (!bar) return null;

  return {
    previousClose: safeNumber(bar.c),
    previousVolume: safeNumber(bar.v),
    source: "Polygon",
  };
}

function scoreFromQuote(quote, polygon) {
  const changePercent = safeNumber(quote?.changePercent);
  const volume = safeNumber(quote?.volume || polygon?.previousVolume);
  const averageVolume = safeNumber(quote?.averageVolume);
  const relativeVolume = averageVolume > 0 ? volume / averageVolume : 1;

  const capitalScore = Math.min(96, Math.max(45, 58 + changePercent * 2.2 + Math.min(relativeVolume, 3) * 12));
  const sentimentScore = Math.min(92, Math.max(42, 55 + changePercent * 2.8));

  return {
    capital: Math.round(capitalScore),
    sentiment: Math.round(sentimentScore),
    relativeVolume: Number(relativeVolume.toFixed(2)),
  };
}

function themeFromProfile(profile, symbol) {
  const text = `${profile?.sector || ""} ${profile?.industry || ""} ${profile?.description || ""}`.toLowerCase();

  if (["NVDA", "MRVL"].includes(symbol) || text.includes("semiconductor")) return "AI Infra";
  if (["VST"].includes(symbol) || text.includes("utilities") || text.includes("power")) return "AI Power";
  if (["CRCL"].includes(symbol) || text.includes("crypto") || text.includes("stablecoin")) return "Stablecoin";
  if (["TSLA"].includes(symbol) || text.includes("automotive")) return "机器人 / EV";
  return profile?.sector || "股票监控";
}

function buildAssetFromStock(symbol, quote, profile, polygon) {
  const quoteScores = scoreFromQuote(quote, polygon);
  const displayName = profile?.name || symbol;
  const changePercent = safeNumber(quote?.changePercent);
  const priceText = quote?.price ? `$${quote.price.toFixed(2)}` : "价格待接入";
  const volumeText = quoteScores.relativeVolume > 1 ? `相对成交量 ${quoteScores.relativeVolume}x` : "成交量未明显放大";

  return {
    symbol,
    name: displayName,
    theme: themeFromProfile(profile, symbol),
    marketData: {
      price: quote?.price || null,
      changePercent,
      volume: quote?.volume || null,
      averageVolume: quote?.averageVolume || null,
      relativeVolume: quoteScores.relativeVolume,
      sources: [quote?.source, profile?.source, polygon?.source].filter(Boolean),
    },
    signals: {
      capital: {
        score: quoteScores.capital,
        evidence: [priceText, `${changePercent.toFixed(2)}% 日内变化`, volumeText],
      },
      industry: {
        score: 68,
        evidence: [profile?.industry || "行业标签待接入", "等待行业景气度数据确认"],
      },
      earnings: {
        score: 58,
        evidence: ["等待 SEC EDGAR / BamSEC / AlphaSense 财报解析"],
      },
      sentiment: {
        score: quoteScores.sentiment,
        evidence: ["等待新闻与社媒热度接入", `${changePercent.toFixed(2)}% 价格反应`],
      },
    },
    thesis: `${displayName} 已接入股票行情。当前先用价格变化与相对成交量形成资金初筛，下一步接期权 OI、LEAP Call 和财报文本提高可靠度。`,
  };
}

async function getStockAsset(symbol) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const [quoteResult, profileResult, polygonResult] = await Promise.allSettled([
    getFinancialModelingPrepQuote(normalizedSymbol),
    getFinancialModelingPrepProfile(normalizedSymbol),
    getPolygonQuote(normalizedSymbol),
  ]);

  const quote = quoteResult.status === "fulfilled" ? normalizeFmpQuote(quoteResult.value) : null;
  const profile = profileResult.status === "fulfilled" ? normalizeFmpProfile(profileResult.value) : null;
  const polygon = polygonResult.status === "fulfilled" ? normalizePolygonPreviousClose(polygonResult.value) : null;

  if (!quote && !profile && !polygon) return null;
  return buildAssetFromStock(normalizedSymbol, quote, profile, polygon);
}

async function getStockAssets(symbols = DEFAULT_SYMBOLS) {
  const assets = await Promise.all(symbols.map((symbol) => getStockAsset(symbol)));
  return assets.filter(Boolean);
}

module.exports = {
  DEFAULT_SYMBOLS,
  getStockAsset,
  getStockAssets,
};
