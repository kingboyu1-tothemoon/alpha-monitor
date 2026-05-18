const dimensions = [
  {
    key: "capital",
    title: "资金",
    weight: 35,
    factors: ["OI 增长", "LEAP Call", "暗池", "Gamma", "大单连续性"],
  },
  {
    key: "industry",
    title: "产业景气度",
    weight: 25,
    factors: ["AI Capex", "电力需求", "Stablecoin adoption", "行业订单"],
  },
  {
    key: "earnings",
    title: "财报拐点",
    weight: 25,
    factors: ["Revenue acceleration", "Guidance", "Margin expansion"],
  },
  {
    key: "sentiment",
    title: "情绪扩散",
    weight: 15,
    factors: ["Reddit 热度", "X 提及量", "Google Trends"],
  },
];

const symbolAliases = {
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
};

const sampleAsset = {
  symbol: "NVDA",
  name: "NVIDIA",
  theme: "AI Infra",
  providerDiagnostics: [{ provider: "sample", ok: true, configured: true }],
  score: 73,
  marketData: {
    price: 135.4,
    changePercent: 2.8,
    relativeVolume: 1.72,
    sources: ["sample"],
  },
  signals: {
    capital: { score: 86, evidence: ["价格放量上行", "相对成交量 1.72x", "等待 OI / LEAP Call / 暗池接入"] },
    industry: { score: 78, evidence: ["AI Capex 相关标的", "数据中心需求强"] },
    earnings: { score: 64, evidence: ["等待 Revenue acceleration / Guidance / Margin 数据接入"] },
    sentiment: { score: 70, evidence: ["等待 Reddit / X / Google Trends 接入"] },
  },
  thesis: "样例结果。线上部署后会调用 /api/stocks 获取真实行情初筛。",
};

const elements = {
  search: document.querySelector("#searchInput"),
  scoreButton: document.querySelector("#scoreButton"),
  apiStatus: document.querySelector("#apiStatus"),
  assetTitle: document.querySelector("#assetTitle"),
  assetMeta: document.querySelector("#assetMeta"),
  totalScore: document.querySelector("#totalScore"),
  priceValue: document.querySelector("#priceValue"),
  changeValue: document.querySelector("#changeValue"),
  volumeValue: document.querySelector("#volumeValue"),
  dimensionGrid: document.querySelector("#dimensionGrid"),
};

function isLikelyTicker(value) {
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(value.trim().toUpperCase());
}

function normalizeSearchSymbol(value) {
  const raw = value.trim().toUpperCase();
  return symbolAliases[raw] || raw;
}

function formatPrice(value) {
  return Number.isFinite(Number(value)) ? `$${Number(value).toFixed(2)}` : "--";
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}%` : "--";
}

function formatRelativeVolume(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}x` : "--";
}

function getSignal(asset, key) {
  return asset?.signals?.[key] || { score: 0, evidence: ["等待数据接入"] };
}

function renderAsset(asset) {
  const market = asset.marketData || {};
  const sources = market.sources?.length ? market.sources.join(" / ") : "数据源待接入";
  const diagnostics = asset.providerDiagnostics?.length
    ? ` · ${asset.providerDiagnostics
        .map((item) => `${item.provider}:${item.ok ? "命中" : item.configured ? "未命中" : "未配置"}`)
        .join(" / ")}`
    : "";

  elements.assetTitle.textContent = `${asset.symbol} · ${asset.name || asset.symbol}`;
  elements.assetMeta.textContent = `${asset.theme || "股票监控"} · ${sources}${market.delayed ? " · 延迟行情" : ""}${diagnostics}`;
  elements.totalScore.textContent = asset.score ?? "--";
  elements.priceValue.textContent = formatPrice(market.price);
  elements.changeValue.textContent = formatPercent(market.changePercent);
  elements.volumeValue.textContent = formatRelativeVolume(market.relativeVolume);

  elements.dimensionGrid.innerHTML = dimensions
    .map((dimension) => {
      const signal = getSignal(asset, dimension.key);
      const score = Number(signal.score || 0);
      return `
        <article class="dimension-card">
          <div class="dimension-head">
            <div>
              <span class="label">权重 ${dimension.weight}%</span>
              <h3>${dimension.title}</h3>
            </div>
            <strong>${score}</strong>
          </div>
          <div class="score-bar"><span style="width:${Math.max(0, Math.min(100, score))}%"></span></div>
          <div class="factor-list">
            ${dimension.factors.map((factor) => `<span>${factor}</span>`).join("")}
          </div>
          <div class="evidence-list">
            ${signal.evidence.map((item) => `<p>${item}</p>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

async function scoreTicker() {
  const symbol = normalizeSearchSymbol(elements.search.value);

  if (!isLikelyTicker(symbol)) {
    elements.apiStatus.textContent = "请输入有效美股代码";
    return;
  }

  if (window.location.protocol === "file:") {
    elements.apiStatus.textContent = "本地预览：显示样例。部署后可拉取真实数据。";
    renderAsset({ ...sampleAsset, symbol });
    return;
  }

  try {
    elements.apiStatus.textContent = `正在评分 ${symbol}...`;
    elements.scoreButton.disabled = true;
    const response = await fetch(`/api/stocks?symbols=${encodeURIComponent(symbol)}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("API unavailable");

    const payload = await response.json();
    const asset = payload.assets?.[0];

    if (!asset) {
      const diagnostics = payload.diagnostics?.length ? JSON.stringify(payload.diagnostics) : "";
      elements.apiStatus.textContent = `${symbol} 暂无可用数据。请检查代码是否正确，或配置 FMP/Polygon 提升覆盖。${diagnostics}`;
      return;
    }

    elements.apiStatus.textContent = `${symbol} 评分完成`;
    renderAsset(asset);
  } catch {
    elements.apiStatus.textContent = `${symbol} 评分失败`;
  } finally {
    elements.scoreButton.disabled = false;
  }
}

elements.scoreButton.addEventListener("click", scoreTicker);
elements.search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    scoreTicker();
  }
});

renderAsset(sampleAsset);
