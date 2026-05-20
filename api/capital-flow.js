const NASDAQ_BASE_URL = "https://api.nasdaq.com/api/quote";

const NASDAQ_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/",
};

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseMarketNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return null;

  const cleaned = String(value)
    .replace(/[$,%]/g, "")
    .replace(/,/g, "")
    .trim();

  return toNumber(cleaned);
}

function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace("/", "-");
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function monthsAgo(months) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

function parseNasdaqDate(value) {
  const [month, day, year] = String(value || "").split("/");
  if (!month || !day || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: NASDAQ_HEADERS });

  if (!response.ok) {
    throw new Error(`Nasdaq request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchNasdaqHistory(symbol) {
  const toDate = formatDate(new Date());
  const fromDate = formatDate(monthsAgo(7));
  const url = `${NASDAQ_BASE_URL}/${encodeURIComponent(
    symbol
  )}/historical?assetclass=stocks&fromdate=${fromDate}&todate=${toDate}&limit=200`;

  const payload = await fetchJson(url);
  const rows = payload?.data?.tradesTable?.rows || [];

  return rows
    .map((row) => ({
      date: parseNasdaqDate(row.date),
      open: parseMarketNumber(row.open),
      high: parseMarketNumber(row.high),
      low: parseMarketNumber(row.low),
      close: parseMarketNumber(row.close),
      volume: parseMarketNumber(row.volume),
    }))
    .filter(
      (bar) =>
        bar.date &&
        Number.isFinite(bar.close) &&
        Number.isFinite(bar.volume) &&
        bar.close > 0 &&
        bar.volume >= 0
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchHistory(symbol) {
  const bars = await fetchNasdaqHistory(symbol);
  return { provider: "Nasdaq Historical", bars };
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function percentChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return current / previous - 1;
}

function getReturn(bars, days) {
  if (bars.length <= days) return null;
  return percentChange(bars[bars.length - 1].close, bars[bars.length - 1 - days].close);
}

function summarizeCapitalFlow(bars) {
  const latest = bars[bars.length - 1];
  const previous = bars[bars.length - 2];
  const previous20 = bars.slice(-21, -1);
  const previous5 = bars.slice(-6, -1);
  const recent20Returns = bars
    .slice(-21)
    .map((bar, index, list) => (index === 0 ? null : Math.abs(percentChange(bar.close, list[index - 1].close))))
    .filter((value) => Number.isFinite(value));

  const avg20Volume = average(previous20.map((bar) => bar.volume));
  const avg5Volume = average(previous5.map((bar) => bar.volume));
  const relativeVolume = avg20Volume ? latest.volume / avg20Volume : null;
  const volumeTrend = avg20Volume && avg5Volume ? avg5Volume / avg20Volume : null;

  return {
    date: latest.date,
    latestClose: latest.close,
    previousClose: previous.close,
    changePercent: percentChange(latest.close, previous.close),
    latestVolume: latest.volume,
    avg20Volume,
    relativeVolume,
    volumeTrend,
    return5d: getReturn(bars, 5),
    return20d: getReturn(bars, 20),
    volatility20d: average(recent20Returns),
    dollarVolume: latest.close * latest.volume,
    dataPoints: bars.length,
  };
}

function scoreCapitalFlow(metrics) {
  let score = 50;

  if (metrics.relativeVolume >= 3) score += 22;
  else if (metrics.relativeVolume >= 2) score += 16;
  else if (metrics.relativeVolume >= 1.5) score += 10;
  else if (metrics.relativeVolume >= 1.2) score += 6;
  else if (metrics.relativeVolume < 0.7) score -= 8;

  if (metrics.changePercent >= 0.05) score += 12;
  else if (metrics.changePercent >= 0.02) score += 7;
  else if (metrics.changePercent >= 0.005) score += 3;
  else if (metrics.changePercent <= -0.05) score -= 14;
  else if (metrics.changePercent <= -0.02) score -= 8;
  else if (metrics.changePercent <= -0.005) score -= 3;

  if (metrics.return5d >= 0.1) score += 12;
  else if (metrics.return5d >= 0.05) score += 7;
  else if (metrics.return5d > 0) score += 3;
  else if (metrics.return5d <= -0.1) score -= 12;
  else if (metrics.return5d <= -0.05) score -= 7;

  if (metrics.return20d >= 0.15) score += 8;
  else if (metrics.return20d >= 0.05) score += 4;
  else if (metrics.return20d <= -0.15) score -= 8;
  else if (metrics.return20d <= -0.05) score -= 4;

  if (metrics.volumeTrend >= 1.5) score += 8;
  else if (metrics.volumeTrend >= 1.2) score += 4;
  else if (metrics.volumeTrend < 0.7) score -= 4;

  if (metrics.dollarVolume >= 1000000000) score += 4;
  else if (metrics.dollarVolume >= 100000000) score += 2;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function classifyFlow(score, metrics) {
  if (score >= 75 && metrics.changePercent >= 0) return "强流入倾向";
  if (score >= 60) return "流入观察";
  if (score <= 35) return "流出或降温";
  return "中性观察";
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "暂无";
}

function formatRatio(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}x` : "暂无";
}

function buildEvidence(metrics, direction) {
  return [
    `流向判断：${direction}`,
    `最新交易日涨跌幅：${formatPercent(metrics.changePercent)}`,
    `相对成交量：${formatRatio(metrics.relativeVolume)}，用于判断是否出现异常放量`,
    `5 日趋势：${formatPercent(metrics.return5d)}，20 日趋势：${formatPercent(metrics.return20d)}`,
    `5 日均量 / 20 日均量：${formatRatio(metrics.volumeTrend)}，用于观察资金关注度是否持续`,
    "免费版不包含真实期权 OI、LEAP Call、Gamma、暗池和逐笔大单数据，这里是基于 Nasdaq 延迟行情的资金异动初筛。",
  ];
}

module.exports = async function handler(req, res) {
  const symbol = normalizeSymbol(req.query?.symbol);

  if (!symbol) {
    res.status(400).json({ ok: false, error: "请输入股票代码。" });
    return;
  }

  try {
    const { provider, bars } = await fetchHistory(symbol);

    if (bars.length < 25) {
      res.status(404).json({
        ok: false,
        symbol,
        error: "暂时没有找到足够的免费行情数据。",
        hint: "请确认代码是否为美股普通股代码，例如 TSLA、NVDA、AAPL、BRK-B。",
      });
      return;
    }

    const metrics = summarizeCapitalFlow(bars);
    const score = scoreCapitalFlow(metrics);
    const direction = classifyFlow(score, metrics);

    res.status(200).json({
      ok: true,
      provider,
      symbol,
      generatedAt: new Date().toISOString(),
      score,
      direction,
      metrics,
      evidence: buildEvidence(metrics, direction),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      symbol,
      error: "免费行情查询失败。",
      hint: "Nasdaq 免费接口可能临时限流或不可用，稍后重试即可。",
      detail: error.message || null,
    });
  }
};
