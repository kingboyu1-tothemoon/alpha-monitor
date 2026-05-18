const {
  getFinancialModelingPrepProfile,
  getFinancialModelingPrepQuote,
  getPolygonQuote,
  getStooqQuote,
  getYahooChart,
} = require("./providers");

const DEFAULT_SYMBOLS = ["MRVL", "VST", "CRCL", "NVDA", "TSLA"];

const SYMBOL_ALIASES = {
  TESLA: "TSLA",
  NVIDIA: "NVDA",
  APPLE: "AAPL",
  MICROSOFT: "MSFT",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  AMAZON: "AMZN",
  META: "META",
  FACEBOOK: "META",
  NETFLIX: "NFLX",
  PALANTIR: "PLTR",
  AMD: "AMD",
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeStockSymbol(value) {
  const raw = String(value || "").trim().toUpperCase();
  return SYMBOL_ALIASES[raw] || raw.replace("/", "-");
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

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (const char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function normalizeStooqQuote(payload) {
  if (!payload) return null;
  const lines = String(payload).trim().split(/\r?\n/);
  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const values = parseCsvLine(lines[1]);
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));

  if (!row.close || row.close === "N/D") return null;

  const open = safeNumber(row.open);
  const close = safeNumber(row.close);
  const changePercent = open > 0 ? ((close - open) / open) * 100 : 0;

  return {
    price: close,
    changePercent,
    volume: safeNumber(row.volume),
    averageVolume: 0,
    marketCap: 0,
    delayed: true,
    source: "Stooq",
  };
}

function normalizeYahooChart(payload) {
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const quote = result?.indicators?.quote?.[0];
  if (!meta || !quote) return null;

  const price = safeNumber(meta.regularMarketPrice || meta.previousClose);
  if (!price) return null;

  const previousClose = safeNumber(meta.previousClose || meta.chartPreviousClose);
  const changePercent = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;
  const volumes = Array.isArray(quote.volume) ? quote.volume.filter((item) => Number.isFinite(Number(item))) : [];
  const volume = volumes.length ? safeNumber(volumes[volumes.length - 1]) : 0;

  return {
    price,
    changePercent,
    volume,
    averageVolume: 0,
    marketCap: 0,
    delayed: true,
    source: "Yahoo Finance",
  };
}

function scoreFromQuote(quote, polygon) {
  const changePercent = safeNumber(quote?.changePercent);
  const volume = safeNumber(quote?.volume || polygon?.previousVolume);
  const averageVolume = safeNumber(quote?.averageVolume);
  const relativeVolume = averageVolume > 0 ? volume / averageVolume : null;
  const volumeBoost = relativeVolume ? Math.min(relativeVolume, 3) * 12 : volume > 0 ? 8 : 0;

  const capitalScore = Math.min(96, Math.max(40, 56 + changePercent * 2.2 + volumeBoost));
  const sentimentScore = Math.min(92, Math.max(42, 55 + changePercent * 2.8));

  return {
    capital: Math.round(capitalScore),
    sentiment: Math.round(sentimentScore),
    relativeVolume: relativeVolume ? Number(relativeVolume.toFixed(2)) : null,
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

function scoreIndustry(profile, symbol) {
  const text = `${symbol} ${profile?.sector || ""} ${profile?.industry || ""} ${profile?.description || ""}`.toLowerCase();
  let score = 52;
  const evidence = [];

  if (text.includes("semiconductor") || text.includes("data center") || ["NVDA", "AMD", "AVGO", "MRVL", "TSM"].includes(symbol)) {
    score += 24;
    evidence.push("AI Capex 相关");
  }
  if (text.includes("utilities") || text.includes("power") || ["VST", "CEG", "GEV", "ETR"].includes(symbol)) {
    score += 24;
    evidence.push("电力需求相关");
  }
  if (text.includes("crypto") || text.includes("blockchain") || text.includes("stablecoin") || ["COIN", "CRCL", "MSTR", "RIOT", "MARA"].includes(symbol)) {
    score += 24;
    evidence.push("Stablecoin adoption / Crypto 相关");
  }
  if (profile?.industry) evidence.push(`行业订单待接入：${profile.industry}`);
  if (!evidence.length) evidence.push("等待 AI Capex / 电力需求 / Stablecoin adoption / 行业订单数据接入");

  return { score: Math.min(92, score), evidence };
}

function scoreEarnings(quote, profile) {
  const changePercent = safeNumber(quote?.changePercent);
  const base = 50 + Math.max(-8, Math.min(10, changePercent)) * 1.2;
  return {
    score: Math.round(Math.max(35, Math.min(82, base))),
    evidence: [
      "Revenue acceleration 待接入",
      "Guidance 待接入",
      "Margin expansion 待接入",
      profile?.source ? `公司资料来源：${profile.source}` : "等待财报数据源",
    ],
  };
}

function scoreSentiment(quote) {
  const changePercent = safeNumber(quote?.changePercent);
  const score = Math.min(88, Math.max(38, 52 + changePercent * 2.5));
  return {
    score: Math.round(score),
    evidence: ["Reddit 热度待接入", "X 提及量待接入", "Google Trends 待接入", `${changePercent.toFixed(2)}% 价格反应`],
  };
}

function buildAssetFromStock(symbol, quote, profile, polygon) {
  const quoteScores = scoreFromQuote(quote, polygon);
  const industry = scoreIndustry(profile, symbol);
  const earnings = scoreEarnings(quote, profile);
  const sentiment = scoreSentiment(quote);
  const displayName = profile?.name || symbol;
  const changePercent = safeNumber(quote?.changePercent);
  const priceText = quote?.price ? `$${quote.price.toFixed(2)}` : "价格待接入";
  const volumeText = quoteScores.relativeVolume
    ? quoteScores.relativeVolume > 1
      ? `相对成交量 ${quoteScores.relativeVolume}x`
      : "成交量未明显放大"
    : quote?.volume
      ? `成交量 ${Math.round(quote.volume).toLocaleString("en-US")}`
      : "成交量待接入";
  const sourceText = [quote?.source, profile?.source, polygon?.source].filter(Boolean).join(" / ");

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
      delayed: Boolean(quote?.delayed),
    },
    signals: {
      capital: {
        score: quoteScores.capital,
        evidence: [priceText, `${changePercent.toFixed(2)}% 日内变化`, volumeText, `数据源：${sourceText || "未识别"}`],
      },
      industry: {
        score: industry.score,
        evidence: industry.evidence,
      },
      earnings: {
        score: earnings.score,
        evidence: earnings.evidence,
      },
      sentiment: {
        score: sentiment.score,
        evidence: sentiment.evidence,
      },
    },
    thesis: `${displayName} 已接入真实股票行情。当前先用价格变化与成交量形成资金初筛，下一步接期权 OI、LEAP Call、Sweep 和暗池数据提高可靠度。`,
  };
}

async function getStockAsset(symbol) {
  const normalizedSymbol = normalizeStockSymbol(symbol);
  const providerDiagnostics = [];
  const [quoteResult, profileResult, polygonResult] = await Promise.allSettled([
    getFinancialModelingPrepQuote(normalizedSymbol),
    getFinancialModelingPrepProfile(normalizedSymbol),
    getPolygonQuote(normalizedSymbol),
  ]);

  let quote = quoteResult.status === "fulfilled" ? normalizeFmpQuote(quoteResult.value) : null;
  const profile = profileResult.status === "fulfilled" ? normalizeFmpProfile(profileResult.value) : null;
  const polygon = polygonResult.status === "fulfilled" ? normalizePolygonPreviousClose(polygonResult.value) : null;

  providerDiagnostics.push({
    provider: "FinancialModelingPrep",
    ok: Boolean(quote || profile),
    configured: Boolean(process.env.FMP_API_KEY),
  });
  providerDiagnostics.push({
    provider: "Polygon",
    ok: Boolean(polygon),
    configured: Boolean(process.env.POLYGON_API_KEY),
  });

  if (!quote) {
    const stooqResult = await Promise.allSettled([getStooqQuote(normalizedSymbol)]);
    quote = stooqResult[0].status === "fulfilled" ? normalizeStooqQuote(stooqResult[0].value) : null;
    providerDiagnostics.push({
      provider: "Stooq",
      ok: Boolean(quote),
      configured: true,
    });
  }

  if (!quote) {
    const yahooResult = await Promise.allSettled([getYahooChart(normalizedSymbol)]);
    quote = yahooResult[0].status === "fulfilled" ? normalizeYahooChart(yahooResult[0].value) : null;
    providerDiagnostics.push({
      provider: "Yahoo Finance",
      ok: Boolean(quote),
      configured: true,
    });
  }

  if (!quote && !profile && !polygon) return null;
  return {
    ...buildAssetFromStock(normalizedSymbol, quote, profile, polygon),
    providerDiagnostics,
  };
}

async function getStockAssets(symbols = DEFAULT_SYMBOLS) {
  const assets = await Promise.all(symbols.map((symbol) => getStockAsset(symbol)));
  return assets.filter(Boolean);
}

module.exports = {
  DEFAULT_SYMBOLS,
  getStockAsset,
  getStockAssets,
  normalizeStockSymbol,
};
