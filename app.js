const aliases = {
  TESLA: "TSLA",
  NVIDIA: "NVDA",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  APPLE: "AAPL",
  MICROSOFT: "MSFT",
  PALANTIR: "PLTR",
};

const elements = {
  input: document.querySelector("#symbolInput"),
  button: document.querySelector("#searchButton"),
  status: document.querySelector("#statusText"),
  card: document.querySelector("#resultCard"),
  assetTitle: document.querySelector("#assetTitle"),
  assetMeta: document.querySelector("#assetMeta"),
  flowScore: document.querySelector("#flowScore"),
  totalOi: document.querySelector("#totalOi"),
  leapCallOi: document.querySelector("#leapCallOi"),
  putCallRatio: document.querySelector("#putCallRatio"),
  gammaExposure: document.querySelector("#gammaExposure"),
  avgIv: document.querySelector("#avgIv"),
  contractsScanned: document.querySelector("#contractsScanned"),
  evidenceList: document.querySelector("#evidenceList"),
};

function normalizeSymbol(value) {
  const raw = value.trim().toUpperCase();
  return aliases[raw] || raw.replace("/", "-");
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value)).toLocaleString("en-US") : "--";
}

function formatRatio(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "--";
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : "--";
}

function renderResult(payload) {
  const metrics = payload.metrics;
  elements.card.hidden = false;
  elements.assetTitle.textContent = payload.symbol;
  elements.assetMeta.textContent = `Polygon Options Snapshot · ${payload.generatedAt}`;
  elements.flowScore.textContent = payload.score;
  elements.totalOi.textContent = formatNumber(metrics.totalOpenInterest);
  elements.leapCallOi.textContent = formatNumber(metrics.leapCallOpenInterest);
  elements.putCallRatio.textContent = formatRatio(metrics.putCallOiRatio);
  elements.gammaExposure.textContent = formatNumber(metrics.gammaExposure);
  elements.avgIv.textContent = formatPercent(metrics.averageIv);
  elements.contractsScanned.textContent = formatNumber(metrics.contractsScanned);
  elements.evidenceList.innerHTML = payload.evidence.map((item) => `<article>${item}</article>`).join("");
}

async function searchSymbol() {
  const symbol = normalizeSymbol(elements.input.value);
  if (!symbol) {
    elements.status.textContent = "请输入股票代码";
    return;
  }

  if (window.location.protocol === "file:") {
    elements.status.textContent = "本地 file 页面不能调用 Vercel API。部署后访问线上地址测试。";
    return;
  }

  try {
    elements.button.disabled = true;
    elements.status.textContent = `正在查询 ${symbol}...`;
    const response = await fetch(`/api/options-flow?symbol=${encodeURIComponent(symbol)}`);
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      elements.status.textContent = payload.error || `${symbol} 查询失败`;
      return;
    }

    elements.status.textContent = `${symbol} 查询完成`;
    renderResult(payload);
  } catch {
    elements.status.textContent = `${symbol} 查询失败，请检查部署和 API key`;
  } finally {
    elements.button.disabled = false;
  }
}

elements.button.addEventListener("click", searchSymbol);
elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchSymbol();
  }
});
