const sampleAssets = [
  {
    symbol: "NVDA",
    name: "NVIDIA",
    theme: "AI Infra",
    marketData: {
      price: 135.4,
      changePercent: 2.8,
      relativeVolume: 1.72,
      sources: ["sample"],
    },
    signals: {
      capital: {
        score: 86,
        evidence: ["样例：价格放量上行", "样例：相对成交量 1.72x", "样例：等待期权 OI 与 LEAP Call 接入"],
      },
    },
    thesis: "资金出现明显主动性，适合进入下一步期权异动复核。",
  },
  {
    symbol: "MRVL",
    name: "Marvell",
    theme: "AI Infra",
    marketData: {
      price: 78.2,
      changePercent: 1.6,
      relativeVolume: 1.34,
      sources: ["sample"],
    },
    signals: {
      capital: {
        score: 78,
        evidence: ["样例：价格温和上行", "样例：成交量高于均值", "样例：等待暗池与 Sweep Order 接入"],
      },
    },
    thesis: "资金有抬升迹象，但还需要期权与大单数据确认是否为主力布局。",
  },
];

const elements = {
  apiStatus: document.querySelector("#apiStatus"),
  search: document.querySelector("#searchInput"),
  scoreButton: document.querySelector("#scoreButton"),
  currentSymbol: document.querySelector("#currentSymbol"),
  currentName: document.querySelector("#currentName"),
  capitalScore: document.querySelector("#capitalScore"),
  relativeVolume: document.querySelector("#relativeVolume"),
  priceChange: document.querySelector("#priceChange"),
  lastPrice: document.querySelector("#lastPrice"),
  capitalThesis: document.querySelector("#capitalThesis"),
  capitalStatus: document.querySelector("#capitalStatus"),
  capitalScoreBar: document.querySelector("#capitalScoreBar"),
  capitalEvidence: document.querySelector("#capitalEvidence"),
  resultsList: document.querySelector("#resultsList"),
};

let results = [...sampleAssets];
let selectedAsset = sampleAssets[0];

function isLikelyTicker(value) {
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(value.trim().toUpperCase());
}

function getCapitalSignal(asset) {
  return asset?.signals?.capital ?? { score: 0, evidence: [] };
}

function getCapitalStatus(score) {
  if (score >= 85) return "强异动";
  if (score >= 70) return "观察";
  if (score >= 55) return "轻微异动";
  return "未触发";
}

function formatPrice(value) {
  return Number.isFinite(Number(value)) ? `$${Number(value).toFixed(2)}` : "价格待接入";
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}%` : "--";
}

function formatRelativeVolume(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}x` : "--";
}

function normalizeAsset(asset) {
  return {
    symbol: asset.symbol,
    name: asset.name || asset.symbol,
    theme: asset.theme || "股票监控",
    marketData: asset.marketData || {},
    signals: {
      capital: getCapitalSignal(asset),
    },
    thesis: asset.thesis || "已生成资金初筛结果，等待更多资金数据源确认。",
  };
}

function upsertResult(asset) {
  const normalized = normalizeAsset(asset);
  const index = results.findIndex((item) => item.symbol === normalized.symbol);

  if (index >= 0) {
    results.splice(index, 1);
  }

  results.unshift(normalized);
  selectedAsset = normalized;
}

function renderSelectedAsset() {
  const asset = selectedAsset;
  const capital = getCapitalSignal(asset);
  const score = Number(capital.score || 0);
  const market = asset.marketData || {};

  elements.currentSymbol.textContent = asset.symbol;
  elements.currentName.textContent = `${asset.name} · ${asset.theme}`;
  elements.capitalScore.textContent = `${score}`;
  elements.relativeVolume.textContent = formatRelativeVolume(market.relativeVolume);
  elements.priceChange.textContent = formatPercent(market.changePercent);
  elements.lastPrice.textContent = formatPrice(market.price);
  elements.capitalThesis.textContent = asset.thesis;
  elements.capitalStatus.textContent = getCapitalStatus(score);
  elements.capitalScoreBar.style.width = `${Math.max(0, Math.min(100, score))}%`;

  elements.capitalEvidence.innerHTML = capital.evidence.length
    ? capital.evidence.map((item) => `<article class="evidence-item">${item}</article>`).join("")
    : '<article class="evidence-item">暂无资金证据。请确认 API key 是否已配置。</article>';
}

function renderResults() {
  elements.resultsList.innerHTML = results
    .map((asset) => {
      const capital = getCapitalSignal(asset);
      const market = asset.marketData || {};
      return `
        <button class="result-row ${asset.symbol === selectedAsset.symbol ? "is-selected" : ""}" type="button" data-symbol="${asset.symbol}">
          <span>
            <strong>${asset.symbol}</strong>
            <small>${asset.name}</small>
          </span>
          <span>${capital.score}/100</span>
          <span>${formatRelativeVolume(market.relativeVolume)}</span>
          <span>${formatPercent(market.changePercent)}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".result-row").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAsset = results.find((item) => item.symbol === button.dataset.symbol) || selectedAsset;
      render();
    });
  });
}

function render() {
  renderSelectedAsset();
  renderResults();
}

async function scoreTicker() {
  const symbol = elements.search.value.trim().toUpperCase();

  if (!isLikelyTicker(symbol)) {
    elements.apiStatus.textContent = "请输入有效美股代码";
    return;
  }

  if (window.location.protocol === "file:") {
    elements.apiStatus.textContent = "部署线上后可拉取真实数据";
    const fallback = sampleAssets.find((asset) => asset.symbol === symbol);
    if (fallback) {
      upsertResult(fallback);
      render();
    }
    return;
  }

  try {
    elements.apiStatus.textContent = `拉取 ${symbol} 资金数据...`;
    elements.scoreButton.disabled = true;

    const response = await fetch(`/api/stocks?symbols=${encodeURIComponent(symbol)}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("Stock API unavailable");

    const payload = await response.json();
    const asset = payload.assets?.[0];

    if (!asset) {
      elements.apiStatus.textContent = `${symbol} 暂无资金数据`;
      return;
    }

    upsertResult(asset);
    elements.apiStatus.textContent = `${symbol} 资金评分 ${asset.signals?.capital?.score ?? "--"}`;
    render();
  } catch {
    elements.apiStatus.textContent = `${symbol} 数据拉取失败`;
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

render();
