const aliases = {
  TESLA: "TSLA",
  NVIDIA: "NVDA",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  APPLE: "AAPL",
  MICROSOFT: "MSFT",
  PALANTIR: "PLTR",
  META: "META",
  AMAZON: "AMZN",
};

const elements = {
  input: document.querySelector("#symbolInput"),
  button: document.querySelector("#searchButton"),
  status: document.querySelector("#statusText"),
  card: document.querySelector("#resultCard"),
  assetTitle: document.querySelector("#assetTitle"),
  assetMeta: document.querySelector("#assetMeta"),
  flowScore: document.querySelector("#flowScore"),
  flowDirection: document.querySelector("#flowDirection"),
  latestClose: document.querySelector("#latestClose"),
  changePercent: document.querySelector("#changePercent"),
  relativeVolume: document.querySelector("#relativeVolume"),
  latestVolume: document.querySelector("#latestVolume"),
  avg20Volume: document.querySelector("#avg20Volume"),
  return5d: document.querySelector("#return5d"),
  return20d: document.querySelector("#return20d"),
  dollarVolume: document.querySelector("#dollarVolume"),
  evidenceList: document.querySelector("#evidenceList"),
};

function normalizeSymbol(value) {
  const raw = value.trim().toUpperCase();
  return aliases[raw] || raw.replace("/", "-");
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value)).toLocaleString("en-US") : "--";
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";

  if (Math.abs(number) >= 1000000000) return `$${(number / 1000000000).toFixed(2)}B`;
  if (Math.abs(number) >= 1000000) return `$${(number / 1000000).toFixed(2)}M`;
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatPrice(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "--";
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  const sign = number > 0 ? "+" : "";
  return `${sign}${(number * 100).toFixed(2)}%`;
}

function formatRatio(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}x` : "--";
}

function renderResult(payload) {
  const metrics = payload.metrics;
  elements.card.hidden = false;
  elements.assetTitle.textContent = payload.symbol;
  elements.assetMeta.textContent = `${payload.provider || "免费延迟行情"} · ${metrics.date} · ${payload.generatedAt}`;
  elements.flowScore.textContent = payload.score;
  elements.flowDirection.textContent = payload.direction;
  elements.latestClose.textContent = formatPrice(metrics.latestClose);
  elements.changePercent.textContent = formatPercent(metrics.changePercent);
  elements.relativeVolume.textContent = formatRatio(metrics.relativeVolume);
  elements.latestVolume.textContent = formatNumber(metrics.latestVolume);
  elements.avg20Volume.textContent = formatNumber(metrics.avg20Volume);
  elements.return5d.textContent = formatPercent(metrics.return5d);
  elements.return20d.textContent = formatPercent(metrics.return20d);
  elements.dollarVolume.textContent = formatCurrency(metrics.dollarVolume);
  elements.evidenceList.innerHTML = payload.evidence.map((item) => `<article>${item}</article>`).join("");
}

async function searchSymbol() {
  const symbol = normalizeSymbol(elements.input.value);
  if (!symbol) {
    elements.status.textContent = "请输入股票代码";
    return;
  }

  if (window.location.protocol === "file:") {
    elements.status.textContent = "本地 file 页面不能调用线上 API。请部署到 Vercel 后，用线上网址测试查询。";
    return;
  }

  try {
    elements.button.disabled = true;
    elements.status.textContent = `正在查询 ${symbol}...`;
    const response = await fetch(`/api/capital-flow?symbol=${encodeURIComponent(symbol)}`);
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      elements.status.textContent = payload.hint || payload.error || `${symbol} 查询失败`;
      return;
    }

    elements.status.textContent = `${symbol} 查询完成`;
    renderResult(payload);
  } catch {
    elements.status.textContent = `${symbol} 查询失败，免费数据源可能临时不可用`;
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
