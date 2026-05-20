const NASDAQ_BASE_URL = "https://api.nasdaq.com/api/quote";

const NASDAQ_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/",
};

const INDUSTRY_THEMES = [
  {
    id: "ai-semiconductor",
    name: "AI 半导体 / 算力基础设施",
    proxy: "SMH",
    proxyName: "VanEck Semiconductor ETF",
    symbols: ["NVDA", "AMD", "AVGO", "MRVL", "MU", "TSM", "ASML", "ARM", "SMCI", "DELL", "HPE", "COHR", "LITE"],
    keywords: ["semiconductor", "chip", "micro", "advanced micro", "nvidia", "broadcom", "marvell"],
    drivers: ["AI 训练/推理需求", "GPU 与 ASIC 升级周期", "HBM 与高速互联供需"],
  },
  {
    id: "ai-software-cloud",
    name: "AI 软件 / 云计算 / 数据基础设施",
    proxy: "IGV",
    proxyName: "iShares Expanded Tech-Software ETF",
    symbols: ["MSFT", "GOOGL", "GOOG", "AMZN", "META", "ORCL", "PLTR", "CRM", "NOW", "SNOW", "DDOG", "MDB", "NET"],
    keywords: ["software", "cloud", "data", "analytics", "platform", "internet", "alphabet", "microsoft", "oracle"],
    drivers: ["AI Agent 商业化", "云端推理消耗", "企业软件 AI 加价能力"],
  },
  {
    id: "ev-autonomy",
    name: "电动车 / 自动驾驶 / 智能制造",
    proxy: "DRIV",
    proxyName: "Global X Autonomous & Electric Vehicles ETF",
    symbols: ["TSLA", "RIVN", "LCID", "NIO", "XPEV", "LI", "GM", "F", "MBLY", "APTV"],
    keywords: ["electric", "vehicle", "automotive", "motor", "auto", "tesla"],
    drivers: ["自动驾驶进展", "电动车渗透率", "机器人与制造自动化"],
  },
  {
    id: "power-grid",
    name: "电力 / 数据中心能源 / 电网设备",
    proxy: "XLU",
    proxyName: "Utilities Select Sector SPDR Fund",
    symbols: ["VST", "CEG", "NRG", "NEE", "DUK", "SO", "GEV", "ETN", "PWR", "HUBB", "GNRC"],
    keywords: ["utility", "utilities", "electric", "energy", "power", "grid"],
    drivers: ["数据中心用电增长", "电网升级", "天然气与核电订单"],
  },
  {
    id: "nuclear-uranium",
    name: "核电 / 铀 / 小型堆",
    proxy: "URA",
    proxyName: "Global X Uranium ETF",
    symbols: ["CCJ", "UEC", "UUUU", "SMR", "OKLO", "LEU"],
    keywords: ["uranium", "nuclear"],
    drivers: ["AI 数据中心电力需求", "核电重启", "铀供需缺口"],
  },
  {
    id: "crypto",
    name: "Crypto / Stablecoin / 链上金融",
    proxy: "IBIT",
    proxyName: "iShares Bitcoin Trust",
    symbols: ["COIN", "MSTR", "HOOD", "RIOT", "MARA", "CLSK", "IREN", "CORZ", "CRCL"],
    keywords: ["bitcoin", "crypto", "blockchain", "coinbase", "digital asset"],
    drivers: ["ETF 资金流", "Stablecoin adoption", "链上活跃度与交易量"],
  },
  {
    id: "robotics-automation",
    name: "机器人 / 自动化",
    proxy: "BOTZ",
    proxyName: "Global X Robotics & Artificial Intelligence ETF",
    symbols: ["ISRG", "SYM", "TER", "ROK", "PATH", "ZBRA", "CGNX"],
    keywords: ["robot", "automation", "industrial", "surgical"],
    drivers: ["机器人量产", "工业自动化订单", "AI 视觉与控制系统"],
  },
  {
    id: "cybersecurity",
    name: "网络安全",
    proxy: "CIBR",
    proxyName: "First Trust Nasdaq Cybersecurity ETF",
    symbols: ["CRWD", "PANW", "ZS", "S", "FTNT", "OKTA", "TENB", "CYBR"],
    keywords: ["security", "cyber", "firewall", "identity"],
    drivers: ["企业安全预算", "AI 攻防升级", "云安全需求"],
  },
  {
    id: "biotech",
    name: "生物科技 / 医药创新",
    proxy: "XBI",
    proxyName: "SPDR S&P Biotech ETF",
    symbols: ["MRNA", "BNTX", "VRTX", "REGN", "BIIB", "GILD", "AMGN", "NTLA", "CRSP"],
    keywords: ["biotech", "pharmaceutical", "therapeutics", "medicine", "bio"],
    drivers: ["临床数据", "审批节奏", "并购与管线价值重估"],
  },
  {
    id: "financials",
    name: "金融 / 资本市场 / Fintech",
    proxy: "XLF",
    proxyName: "Financial Select Sector SPDR Fund",
    symbols: ["JPM", "BAC", "GS", "MS", "V", "MA", "AXP", "PYPL", "SOFI", "SQ"],
    keywords: ["bank", "financial", "capital", "payments", "credit"],
    drivers: ["利率周期", "交易活跃度", "信贷质量与支付增长"],
  },
  {
    id: "energy",
    name: "能源 / 油气",
    proxy: "XLE",
    proxyName: "Energy Select Sector SPDR Fund",
    symbols: ["XOM", "CVX", "COP", "OXY", "SLB", "HAL", "LNG"],
    keywords: ["oil", "gas", "petroleum", "energy"],
    drivers: ["油气价格", "资本开支纪律", "地缘风险"],
  },
];

const DEFAULT_THEME = {
  id: "broad-growth",
  name: "广义成长股 / 纳指风险偏好",
  proxy: "QQQ",
  proxyName: "Invesco QQQ Trust",
  symbols: [],
  keywords: [],
  drivers: ["纳指风险偏好", "成长股估值环境", "流动性与利率预期"],
};

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseMarketNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return null;

  const raw = String(value).trim();
  const isNegative = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw
    .replace(/[$,%]/g, "")
    .replace(/,/g, "")
    .replace(/[()]/g, "")
    .trim();

  const parsed = toNumber(cleaned);
  return Number.isFinite(parsed) && isNegative ? -parsed : parsed;
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

async function fetchNasdaqHistory(symbol, assetClass = "stocks") {
  const toDate = formatDate(new Date());
  const fromDate = formatDate(monthsAgo(7));
  const url = `${NASDAQ_BASE_URL}/${encodeURIComponent(
    symbol
  )}/historical?assetclass=${assetClass}&fromdate=${fromDate}&todate=${toDate}&limit=200`;

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

async function fetchNasdaqInfo(symbol) {
  const payload = await fetchJson(`${NASDAQ_BASE_URL}/${encodeURIComponent(symbol)}/info?assetclass=stocks`);
  return {
    companyName: payload?.data?.companyName || "",
    stockType: payload?.data?.stockType || "",
    exchange: payload?.data?.exchange || "",
  };
}

async function fetchNasdaqFinancials(symbol, frequency = 2) {
  return fetchJson(`https://api.nasdaq.com/api/company/${encodeURIComponent(symbol)}/financials?frequency=${frequency}`);
}

async function fetchNasdaqEarningsCalendar(symbol) {
  return fetchJson(`https://api.nasdaq.com/api/calendar/earnings?symbol=${encodeURIComponent(symbol)}`);
}

async function fetchHistory(symbol, assetClass = "stocks") {
  let bars = await fetchNasdaqHistory(symbol, assetClass);

  if (!bars.length && assetClass === "stocks") {
    bars = await fetchNasdaqHistory(symbol, "etf");
  }

  return {
    provider: assetClass === "etf" ? "Nasdaq ETF Historical" : "Nasdaq Historical",
    bars,
  };
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

function confidenceFromVolume(metrics) {
  if (metrics.relativeVolume >= 1.5 || metrics.dollarVolume >= 1000000000) return "中等";
  if (metrics.relativeVolume >= 1.1 || metrics.dollarVolume >= 100000000) return "偏低";
  return "低";
}

function buildQualitativeSignals(metrics) {
  const upDay = metrics.changePercent > 0.005;
  const downDay = metrics.changePercent < -0.005;
  const highVolume = metrics.relativeVolume >= 1.5;
  const veryHighVolume = metrics.relativeVolume >= 2;
  const risingTrend = metrics.return5d > 0 && metrics.return20d > 0;
  const fallingTrend = metrics.return5d < 0 && metrics.return20d < 0;
  const volumeExpanding = metrics.volumeTrend >= 1.2;
  const highDollarVolume = metrics.dollarVolume >= 1000000000;
  const volatileMove = Math.abs(metrics.changePercent || 0) >= 0.03;
  const confidence = confidenceFromVolume(metrics);

  let oiStatus = "中性";
  let oiSummary = "没有真实 OI 数据，只能从成交量变化判断市场关注度是否升温。";
  if (highVolume && upDay) {
    oiStatus = "偏强";
    oiSummary = "放量上涨，说明当日资金关注度提升，期权持仓增加的概率相对更高。";
  } else if (highVolume && downDay) {
    oiStatus = "分歧";
    oiSummary = "放量下跌，可能是看跌对冲或多空换手，不能直接视为看涨建仓。";
  } else if (metrics.relativeVolume < 0.8) {
    oiStatus = "偏弱";
    oiSummary = "相对成交量偏低，暂时看不出明显新增资金关注。";
  }

  let leapStatus = "中性";
  let leapSummary = "没有到期日结构数据，无法确认 LEAP Call 是否真实异动。";
  if (risingTrend && volumeExpanding) {
    leapStatus = "偏强";
    leapSummary = "短中期趋势同时向上且量能扩张，长线看涨仓位布局的可能性提高。";
  } else if (fallingTrend) {
    leapStatus = "偏弱";
    leapSummary = "短中期趋势偏弱，暂时不支持长期看涨仓位正在强化的判断。";
  }

  let gammaStatus = "中性";
  let gammaSummary = "没有期权链和 Greeks，无法判断正 Gamma 或负 Gamma 站位。";
  if (veryHighVolume && volatileMove) {
    gammaStatus = "活跃";
    gammaSummary = "放量且价格波动较大，短线 Gamma/做市商对冲影响可能升高。";
  } else if (highVolume) {
    gammaStatus = "观察";
    gammaSummary = "成交量高于常态，若同时接近关键价位，Gamma 影响值得继续跟踪。";
  }

  let darkPoolStatus = "中性";
  let darkPoolSummary = "没有暗池成交明细，不能确认机构暗池买卖。";
  if (highDollarVolume && highVolume && Math.abs(metrics.changePercent || 0) < 0.015) {
    darkPoolStatus = "可疑吸收";
    darkPoolSummary = "成交额和相对成交量都高，但价格波动不大，可能存在大资金换手或被动吸收。";
  } else if (highDollarVolume && upDay) {
    darkPoolStatus = "偏强";
    darkPoolSummary = "大成交额配合上涨，机构资金参与度可能较高。";
  } else if (highDollarVolume && downDay) {
    darkPoolStatus = "分歧";
    darkPoolSummary = "大成交额配合下跌，可能是减仓、对冲或换手，方向需要谨慎。";
  }

  let sweepStatus = "中性";
  let sweepSummary = "没有逐笔订单，不能确认 Sweep 或连续大单。";
  if (volumeExpanding && risingTrend) {
    sweepStatus = "偏强";
    sweepSummary = "5 日均量高于 20 日均量且趋势向上，说明资金关注有一定连续性。";
  } else if (veryHighVolume && !risingTrend) {
    sweepStatus = "一次性异动";
    sweepSummary = "当日放量明显，但趋势尚未跟上，更像单日事件驱动，需观察连续性。";
  } else if (!volumeExpanding) {
    sweepStatus = "偏弱";
    sweepSummary = "近期量能没有持续扩张，暂时看不到连续大单特征。";
  }

  return [
    {
      title: "期权 OI 变化",
      status: oiStatus,
      confidence,
      summary: oiSummary,
    },
    {
      title: "LEAP Call 布局",
      status: leapStatus,
      confidence: confidence === "中等" && risingTrend ? "偏低" : "低",
      summary: leapSummary,
    },
    {
      title: "Gamma 影响",
      status: gammaStatus,
      confidence: highVolume ? "偏低" : "低",
      summary: gammaSummary,
    },
    {
      title: "暗池成交",
      status: darkPoolStatus,
      confidence: highDollarVolume ? "偏低" : "低",
      summary: darkPoolSummary,
    },
    {
      title: "大单连续性",
      status: sweepStatus,
      confidence,
      summary: sweepSummary,
    },
  ];
}

function inferIndustryTheme(symbol, info) {
  const companyName = String(info?.companyName || "").toLowerCase();

  for (const theme of INDUSTRY_THEMES) {
    if (theme.symbols.includes(symbol)) return theme;
  }

  for (const theme of INDUSTRY_THEMES) {
    if (theme.keywords.some((keyword) => companyName.includes(keyword))) return theme;
  }

  return DEFAULT_THEME;
}

function scoreIndustryOutlook(themeMetrics, benchmarkMetrics, stockMetrics) {
  const relativeStrength20 = (themeMetrics.return20d || 0) - (benchmarkMetrics.return20d || 0);
  const stockVsTheme20 = (stockMetrics.return20d || 0) - (themeMetrics.return20d || 0);
  let score = 50;

  if (themeMetrics.return20d >= 0.15) score += 18;
  else if (themeMetrics.return20d >= 0.08) score += 12;
  else if (themeMetrics.return20d >= 0.03) score += 6;
  else if (themeMetrics.return20d <= -0.12) score -= 16;
  else if (themeMetrics.return20d <= -0.05) score -= 9;

  if (themeMetrics.return5d >= 0.06) score += 12;
  else if (themeMetrics.return5d >= 0.025) score += 7;
  else if (themeMetrics.return5d > 0) score += 3;
  else if (themeMetrics.return5d <= -0.06) score -= 12;
  else if (themeMetrics.return5d <= -0.025) score -= 7;

  if (relativeStrength20 >= 0.08) score += 14;
  else if (relativeStrength20 >= 0.03) score += 8;
  else if (relativeStrength20 <= -0.08) score -= 14;
  else if (relativeStrength20 <= -0.03) score -= 8;

  if (themeMetrics.relativeVolume >= 1.5) score += 8;
  else if (themeMetrics.relativeVolume >= 1.15) score += 4;
  else if (themeMetrics.relativeVolume < 0.75) score -= 4;

  if (stockVsTheme20 >= 0.08) score += 8;
  else if (stockVsTheme20 >= 0.03) score += 4;
  else if (stockVsTheme20 <= -0.08) score -= 8;
  else if (stockVsTheme20 <= -0.03) score -= 4;

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    relativeStrength20,
    stockVsTheme20,
  };
}

function classifyIndustry(score) {
  if (score >= 78) return "产业加速期";
  if (score >= 64) return "景气改善";
  if (score >= 45) return "中性观察";
  return "景气降温";
}

function buildIndustryEvidence(theme, themeMetrics, benchmarkMetrics, stockMetrics, scored) {
  return [
    `${theme.proxy} 近 20 日趋势：${formatPercent(themeMetrics.return20d)}，近 5 日趋势：${formatPercent(themeMetrics.return5d)}`,
    `${theme.proxy} 相对成交量：${formatRatio(themeMetrics.relativeVolume)}，用于观察产业资金关注度`,
    `相对 QQQ 20 日强弱：${formatPercent(scored.relativeStrength20)}，判断该产业是否跑赢成长股基准`,
    `个股相对产业代理 20 日强弱：${formatPercent(scored.stockVsTheme20)}，判断标的是否是板块内强势股`,
    `主要观察变量：${theme.drivers.join(" / ")}`,
  ];
}

async function buildIndustryOutlook(symbol, info, stockMetrics) {
  const theme = inferIndustryTheme(symbol, info);
  const [themeHistory, benchmarkHistory] = await Promise.all([
    fetchHistory(theme.proxy, "etf"),
    fetchHistory("QQQ", "etf"),
  ]);

  if (themeHistory.bars.length < 25 || benchmarkHistory.bars.length < 25) {
    return {
      theme: theme.name,
      proxySymbol: theme.proxy,
      proxyName: theme.proxyName,
      score: 50,
      stage: "数据不足",
      metrics: null,
      evidence: ["暂时没有拿到足够的行业代理行情，产业景气度维持中性。"],
    };
  }

  const themeMetrics = summarizeCapitalFlow(themeHistory.bars);
  const benchmarkMetrics = summarizeCapitalFlow(benchmarkHistory.bars);
  const scored = scoreIndustryOutlook(themeMetrics, benchmarkMetrics, stockMetrics);
  const stage = classifyIndustry(scored.score);

  return {
    theme: theme.name,
    proxySymbol: theme.proxy,
    proxyName: theme.proxyName,
    score: scored.score,
    stage,
    metrics: {
      proxyReturn5d: themeMetrics.return5d,
      proxyReturn20d: themeMetrics.return20d,
      proxyRelativeVolume: themeMetrics.relativeVolume,
      benchmarkSymbol: "QQQ",
      benchmarkReturn20d: benchmarkMetrics.return20d,
      relativeStrength20: scored.relativeStrength20,
      stockVsTheme20: scored.stockVsTheme20,
    },
    evidence: buildIndustryEvidence(theme, themeMetrics, benchmarkMetrics, stockMetrics, scored),
  };
}

function getFinancialPeriods(table) {
  const headers = table?.headers || {};
  return Object.entries(headers)
    .filter(([key]) => key !== "value1")
    .map(([key, date]) => ({ key, date }))
    .filter((period) => period.date);
}

function findFinancialRow(table, labels) {
  const rows = table?.rows || [];
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  return rows.find((row) => {
    const label = String(row.value1 || "").toLowerCase();
    return normalizedLabels.some((target) => label.includes(target));
  });
}

function parseQuarterlyFinancials(payload) {
  const table = payload?.data?.incomeStatementTable;
  const periods = getFinancialPeriods(table).slice(0, 4);
  const revenueRow = findFinancialRow(table, ["total revenue", "revenue"]);
  const costRow = findFinancialRow(table, ["cost of revenue", "cost of goods"]);
  const grossProfitRow = findFinancialRow(table, ["gross profit"]);

  return periods
    .map((period) => {
      const revenue = parseMarketNumber(revenueRow?.[period.key]);
      const costOfRevenue = parseMarketNumber(costRow?.[period.key]);
      const reportedGrossProfit = parseMarketNumber(grossProfitRow?.[period.key]);
      const grossProfit =
        Number.isFinite(reportedGrossProfit)
          ? reportedGrossProfit
          : Number.isFinite(revenue) && Number.isFinite(costOfRevenue)
            ? revenue - costOfRevenue
            : null;

      return {
        date: period.date,
        revenue,
        costOfRevenue,
        grossProfit,
        grossMargin: Number.isFinite(revenue) && revenue !== 0 && Number.isFinite(grossProfit) ? grossProfit / revenue : null,
      };
    })
    .filter((quarter) => Number.isFinite(quarter.revenue) && quarter.revenue > 0);
}

function parseEarningsCalendar(payload, symbol) {
  const row = (payload?.data?.rows || []).find((item) => String(item.symbol || "").toUpperCase() === symbol);
  if (!row) return null;

  const epsForecast = parseMarketNumber(row.epsForecast);
  const lastYearEps = parseMarketNumber(row.lastYearEPS);

  return {
    fiscalQuarterEnding: row.fiscalQuarterEnding || "",
    epsForecast,
    lastYearEps,
    epsForecastGrowth:
      Number.isFinite(epsForecast) && Number.isFinite(lastYearEps) && lastYearEps !== 0
        ? epsForecast / lastYearEps - 1
        : null,
    reportTime: row.time || "",
    lastYearReportDate: row.lastYearRptDt || "",
  };
}

function scoreRevenueAcceleration(latestGrowth, previousGrowth, acceleration) {
  let score = 50;

  if (latestGrowth >= 0.2) score += 18;
  else if (latestGrowth >= 0.1) score += 12;
  else if (latestGrowth >= 0.03) score += 6;
  else if (latestGrowth <= -0.1) score -= 14;
  else if (latestGrowth <= -0.03) score -= 7;

  if (acceleration >= 0.08) score += 16;
  else if (acceleration >= 0.03) score += 10;
  else if (acceleration > 0) score += 4;
  else if (acceleration <= -0.08) score -= 16;
  else if (acceleration <= -0.03) score -= 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreMarginExpansion(latestMargin, previousMargin, expansion) {
  let score = 50;

  if (latestMargin >= 0.65) score += 10;
  else if (latestMargin >= 0.5) score += 6;
  else if (latestMargin < 0.25) score -= 8;

  if (expansion >= 0.05) score += 18;
  else if (expansion >= 0.02) score += 12;
  else if (expansion > 0) score += 5;
  else if (expansion <= -0.05) score -= 18;
  else if (expansion <= -0.02) score -= 12;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreGuidanceProxy(calendar) {
  if (!calendar || !Number.isFinite(calendar.epsForecastGrowth)) {
    return 50;
  }

  let score = 50;
  if (calendar.epsForecastGrowth >= 0.5) score += 22;
  else if (calendar.epsForecastGrowth >= 0.25) score += 15;
  else if (calendar.epsForecastGrowth >= 0.1) score += 8;
  else if (calendar.epsForecastGrowth <= -0.3) score -= 20;
  else if (calendar.epsForecastGrowth <= -0.1) score -= 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function classifyEarnings(score) {
  if (score >= 78) return "财报拐点确认";
  if (score >= 64) return "财报改善";
  if (score >= 45) return "中性观察";
  return "财报承压";
}

function statusFromScore(score, strong, weak) {
  if (score >= 65) return strong;
  if (score <= 40) return weak;
  return "中性";
}

function buildEarningsSignals(metrics) {
  return [
    {
      title: "Revenue acceleration",
      status: statusFromScore(metrics.revenueScore, "收入加速", "收入减速"),
      confidence: metrics.hasFinancials ? "中等" : "低",
      summary: metrics.hasFinancials
        ? `最新季度收入环比 ${formatPercent(metrics.latestRevenueGrowth)}，较上一轮增长变化 ${formatPercent(metrics.revenueAcceleration)}。`
        : "暂时没有拿到足够的季度收入数据，收入加速维持中性。",
    },
    {
      title: "Guidance",
      status: statusFromScore(metrics.guidanceScore, "预期改善", "预期承压"),
      confidence: metrics.hasCalendar ? "偏低" : "低",
      summary: metrics.hasCalendar
        ? `Nasdaq earnings calendar 显示 EPS consensus 相对去年同期变化 ${formatPercent(metrics.epsForecastGrowth)}。这只是市场预期代理，不等同于管理层正式指引。`
        : "没有接入 earnings call transcript 或公司指引文本，暂不判断管理层正式 Guidance。",
    },
    {
      title: "Margin expansion",
      status: statusFromScore(metrics.marginScore, "毛利率扩张", "毛利率收缩"),
      confidence: metrics.hasFinancials && Number.isFinite(metrics.grossMarginExpansion) ? "中等" : "低",
      summary: Number.isFinite(metrics.grossMarginExpansion)
        ? `最新季度毛利率 ${formatPercent(metrics.latestGrossMargin)}，较上一季度变化 ${formatPercent(metrics.grossMarginExpansion)}。`
        : "暂时没有拿到足够的成本或毛利数据，毛利率变化维持中性。",
    },
  ];
}

function buildEarningsEvidence(metrics) {
  return [
    `最新财报季度：${metrics.latestQuarter || "暂无"}`,
    `最新季度收入：${Number.isFinite(metrics.latestRevenue) ? Math.round(metrics.latestRevenue).toLocaleString("en-US") : "暂无"}`,
    `收入环比增速：${formatPercent(metrics.latestRevenueGrowth)}，收入加速度：${formatPercent(metrics.revenueAcceleration)}`,
    `毛利率：${formatPercent(metrics.latestGrossMargin)}，毛利率变化：${formatPercent(metrics.grossMarginExpansion)}`,
    `EPS consensus YoY：${formatPercent(metrics.epsForecastGrowth)}，该项是 Guidance 代理，不是管理层指引原文。`,
  ];
}

async function buildEarningsInflection(symbol) {
  const [financialPayload, calendarPayload] = await Promise.all([
    fetchNasdaqFinancials(symbol, 2).catch(() => null),
    fetchNasdaqEarningsCalendar(symbol).catch(() => null),
  ]);

  const quarters = parseQuarterlyFinancials(financialPayload);
  const calendar = parseEarningsCalendar(calendarPayload, symbol);
  const latest = quarters[0] || {};
  const previous = quarters[1] || {};
  const beforePrevious = quarters[2] || {};
  const latestRevenueGrowth = percentChange(latest.revenue, previous.revenue);
  const previousRevenueGrowth = percentChange(previous.revenue, beforePrevious.revenue);
  const revenueAcceleration =
    Number.isFinite(latestRevenueGrowth) && Number.isFinite(previousRevenueGrowth)
      ? latestRevenueGrowth - previousRevenueGrowth
      : null;
  const grossMarginExpansion =
    Number.isFinite(latest.grossMargin) && Number.isFinite(previous.grossMargin)
      ? latest.grossMargin - previous.grossMargin
      : null;
  const revenueScore = Number.isFinite(latestRevenueGrowth)
    ? scoreRevenueAcceleration(latestRevenueGrowth, previousRevenueGrowth, revenueAcceleration || 0)
    : 50;
  const marginScore = Number.isFinite(latest.grossMargin)
    ? scoreMarginExpansion(latest.grossMargin, previous.grossMargin, grossMarginExpansion || 0)
    : 50;
  const guidanceScore = scoreGuidanceProxy(calendar);
  const score = Math.round(revenueScore * 0.4 + guidanceScore * 0.3 + marginScore * 0.3);
  const metrics = {
    hasFinancials: quarters.length >= 3,
    hasCalendar: Boolean(calendar),
    latestQuarter: latest.date || "",
    latestRevenue: latest.revenue,
    latestRevenueGrowth,
    previousRevenueGrowth,
    revenueAcceleration,
    latestGrossMargin: latest.grossMargin,
    previousGrossMargin: previous.grossMargin,
    grossMarginExpansion,
    epsForecastGrowth: calendar?.epsForecastGrowth ?? null,
    epsForecast: calendar?.epsForecast ?? null,
    lastYearEps: calendar?.lastYearEps ?? null,
    fiscalQuarterEnding: calendar?.fiscalQuarterEnding || "",
    revenueScore,
    guidanceScore,
    marginScore,
  };

  return {
    score,
    stage: classifyEarnings(score),
    metrics,
    signals: buildEarningsSignals(metrics),
    evidence: buildEarningsEvidence(metrics),
  };
}

function scoreRedditProxy(stockMetrics) {
  let score = 45;

  if (stockMetrics.relativeVolume >= 3) score += 28;
  else if (stockMetrics.relativeVolume >= 2) score += 20;
  else if (stockMetrics.relativeVolume >= 1.5) score += 12;
  else if (stockMetrics.relativeVolume >= 1.15) score += 6;
  else if (stockMetrics.relativeVolume < 0.75) score -= 8;

  if (Math.abs(stockMetrics.changePercent || 0) >= 0.08) score += 14;
  else if (Math.abs(stockMetrics.changePercent || 0) >= 0.04) score += 9;
  else if (Math.abs(stockMetrics.changePercent || 0) >= 0.02) score += 5;

  if (stockMetrics.dollarVolume >= 1000000000) score += 8;
  else if (stockMetrics.dollarVolume >= 250000000) score += 4;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreXProxy(stockMetrics, industryOutlook, earningsInflection) {
  let score = 45;

  if (stockMetrics.changePercent >= 0.05) score += 16;
  else if (stockMetrics.changePercent >= 0.025) score += 10;
  else if (stockMetrics.changePercent >= 0.01) score += 5;
  else if (stockMetrics.changePercent <= -0.05) score += 10;
  else if (stockMetrics.changePercent <= -0.025) score += 6;

  if (stockMetrics.return5d >= 0.1) score += 12;
  else if (stockMetrics.return5d >= 0.05) score += 7;
  else if (stockMetrics.return5d <= -0.1) score += 8;

  if (stockMetrics.relativeVolume >= 1.5) score += 8;
  if ((industryOutlook?.score || 0) >= 70) score += 6;
  if ((earningsInflection?.score || 0) >= 70) score += 6;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function scoreGoogleTrendsProxy(stockMetrics, industryOutlook, earningsInflection) {
  let score = 45;

  if (Math.abs(stockMetrics.return20d || 0) >= 0.2) score += 16;
  else if (Math.abs(stockMetrics.return20d || 0) >= 0.1) score += 10;
  else if (Math.abs(stockMetrics.return20d || 0) >= 0.05) score += 5;

  if ((industryOutlook?.score || 0) >= 78) score += 14;
  else if ((industryOutlook?.score || 0) >= 64) score += 8;
  else if ((industryOutlook?.score || 0) <= 40) score += 4;

  if ((earningsInflection?.score || 0) >= 78) score += 10;
  else if ((earningsInflection?.score || 0) >= 64) score += 6;
  else if ((earningsInflection?.score || 0) <= 40) score += 4;

  if (stockMetrics.dollarVolume >= 1000000000) score += 6;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function classifySentiment(score) {
  if (score >= 78) return "情绪爆发期";
  if (score >= 64) return "扩散加速";
  if (score >= 45) return "中性发酵";
  return "热度偏冷";
}

function buildSentimentSignals(stockMetrics, industryOutlook, earningsInflection, scores) {
  return [
    {
      title: "Reddit 热度",
      status: statusFromScore(scores.reddit, "热度升温", "热度偏冷"),
      confidence: stockMetrics.relativeVolume >= 1.5 ? "偏低" : "低",
      summary: `基于相对成交量 ${formatRatio(stockMetrics.relativeVolume)}、当日波动 ${formatPercent(stockMetrics.changePercent)} 和成交额推断散户讨论热度；未读取 Reddit 真实帖子数。`,
    },
    {
      title: "X 提及量",
      status: statusFromScore(scores.x, "传播加速", "传播较弱"),
      confidence: stockMetrics.relativeVolume >= 1.5 || Math.abs(stockMetrics.changePercent || 0) >= 0.03 ? "偏低" : "低",
      summary: `基于短线涨跌、5 日趋势 ${formatPercent(stockMetrics.return5d)}、产业评分 ${industryOutlook?.score ?? "暂无"} 和财报评分 ${earningsInflection?.score ?? "暂无"} 推断传播速度；未读取 X 真实提及量。`,
    },
    {
      title: "Google Trends",
      status: statusFromScore(scores.google, "搜索升温", "搜索偏冷"),
      confidence: "低",
      summary: `基于 20 日趋势 ${formatPercent(stockMetrics.return20d)}、产业景气度和财报事件强度推断搜索兴趣；未读取 Google Trends 真实指数。`,
    },
  ];
}

function buildSentimentEvidence(stockMetrics, industryOutlook, earningsInflection, scores) {
  return [
    `Reddit 代理分：${scores.reddit}，核心依据是相对成交量、单日波动和成交额。`,
    `X 代理分：${scores.x}，核心依据是短线价格变化、5 日趋势、产业和财报催化。`,
    `Google Trends 代理分：${scores.google}，核心依据是 20 日趋势、产业景气度和财报事件强度。`,
    "当前版本没有接入 Reddit API、X API 或 Google Trends API，因此不展示真实提及量和搜索指数。",
  ];
}

function buildSentimentDiffusion(stockMetrics, industryOutlook, earningsInflection) {
  const scores = {
    reddit: scoreRedditProxy(stockMetrics),
    x: scoreXProxy(stockMetrics, industryOutlook, earningsInflection),
    google: scoreGoogleTrendsProxy(stockMetrics, industryOutlook, earningsInflection),
  };
  const score = Math.round(scores.reddit * 0.35 + scores.x * 0.35 + scores.google * 0.3);

  return {
    score,
    stage: classifySentiment(score),
    metrics: scores,
    signals: buildSentimentSignals(stockMetrics, industryOutlook, earningsInflection, scores),
    evidence: buildSentimentEvidence(stockMetrics, industryOutlook, earningsInflection, scores),
  };
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
    const [{ provider, bars }, info] = await Promise.all([
      fetchHistory(symbol),
      fetchNasdaqInfo(symbol).catch(() => ({ companyName: "", stockType: "", exchange: "" })),
    ]);

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
    const qualitativeSignals = buildQualitativeSignals(metrics);
    const industryOutlook = await buildIndustryOutlook(symbol, info, metrics);
    const earningsInflection = await buildEarningsInflection(symbol);
    const sentimentDiffusion = buildSentimentDiffusion(metrics, industryOutlook, earningsInflection);

    res.status(200).json({
      ok: true,
      provider,
      symbol,
      companyName: info.companyName,
      generatedAt: new Date().toISOString(),
      score,
      direction,
      metrics,
      qualitativeSignals,
      industryOutlook,
      earningsInflection,
      sentimentDiffusion,
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
