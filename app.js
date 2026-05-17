const signalModel = [
  {
    key: "capital",
    label: "资金先动",
    short: "资金",
    weight: 0.35,
    examples: ["LEAP Call 异动", "OI 暴增", "暗池成交", "Gamma positioning", "主力大单扫货", "板块 ETF 放量"],
  },
  {
    key: "industry",
    label: "产业强化",
    short: "产业",
    weight: 0.25,
    examples: ["AI 推理需求爆发", "电力短缺", "Stablecoin adoption", "AI Agent 商业化", "机器人量产", "GPU 涨价"],
  },
  {
    key: "earnings",
    label: "财报验证",
    short: "财报",
    weight: 0.25,
    examples: ["指引上调", "毛利率拐点", "Capex 暴增", "backlog 增长", "AI revenue 首次披露"],
  },
  {
    key: "sentiment",
    label: "情绪扩散",
    short: "情绪",
    weight: 0.15,
    examples: ["KOL 开始讨论", "Reddit 热度暴增", "X 传播", "新闻媒体集中报道"],
  },
];

const realtimeModules = [
  {
    title: "期权异动监控",
    focus: "主力布局评分",
    score: 91,
    sources: ["Unusual Whales", "Polygon", "Tradier", "CBOE", "Nasdaq API"],
    metrics: ["LEAP Call 异动", "OI 增长率", "Put/Call Ratio", "Sweep Order", "Dark Pool", "IV 爆发", "Gamma Exposure"],
    aiFilters: ["是否长期 LEAP", "是否连续几天建仓", "是否财报前布局", "是否和产业催化一致"],
    insight: "过滤短线噪音，只保留财报前连续建仓、Gamma 结构配合、暗池同步放量的信号。",
  },
  {
    title: "财报拐点监控",
    focus: "基本面验证评分",
    score: 88,
    sources: ["SEC EDGAR", "Earnings Transcript", "Finviz", "AlphaVantage"],
    metrics: ["Revenue acceleration", "Capex increase", "Guidance raise", "AI revenue mention", "Gross margin expansion", "Backlog growth"],
    aiFilters: ["是否超预期", "是否首次披露新收入", "是否上调指引", "是否出现利润率拐点"],
    insight: "自动读财报和电话会，抽取增长加速、指引上调、AI 收入披露等戴维斯双击证据。",
  },
  {
    title: "行业景气度监控",
    focus: "产业加速评分",
    score: 86,
    sources: ["行业数据库", "ETF 持仓", "链上数据", "能源价格", "公司订单"],
    metrics: ["GPU 交付周期", "HBM 价格", "Datacenter Capex", "Stablecoin supply", "ETF inflow", "机器人订单"],
    aiFilters: ["产业是否进入加速期", "价格或订单是否连续上行", "是否传导到上市公司收入", "是否有供需缺口"],
    insight: "把 AI Infra、Crypto、机器人等赛道拆成可观测指标，判断产业是否正在加速。",
  },
  {
    title: "舆情热度监控",
    focus: "扩散速度评分",
    score: 79,
    sources: ["Reddit", "X(Twitter)", "YouTube", "新闻", "Google Trends"],
    metrics: ["Mention growth", "情绪倾向", "热词变化", "KOL 扩散速度"],
    aiFilters: ["是否从小圈层扩散", "是否出现新叙事热词", "是否由 KOL 接力", "是否媒体集中报道"],
    insight: "识别从机构逻辑到大众共识的扩散拐点，例如 Stablecoin 热度 7 天增长 240%。",
  },
];

const dataSourceGroups = [
  {
    category: "股票 / 期权",
    role: "资金先动与主力布局",
    sources: ["Polygon", "Tradier", "CBOE", "Nasdaq", "FinancialModelingPrep"],
    usage: "期权链、OI、IV、Sweep、成交量、报价、公司基础数据，用来计算主力布局评分。",
  },
  {
    category: "财报",
    role: "基本面拐点验证",
    sources: ["SEC EDGAR", "AlphaSense", "BamSEC"],
    usage: "10-K、10-Q、8-K、电话会纪要、管理层指引和关键词变化，用来判断 Revenue acceleration、Guidance raise、Margin expansion。",
  },
  {
    category: "新闻",
    role: "催化剂与共识扩散",
    sources: ["Benzinga", "Reuters", "Bloomberg", "The Information"],
    usage: "快速事件、深度产业报道、公司新闻和机构观点，用来确认催化剂是否被市场定价。",
  },
  {
    category: "Crypto",
    role: "链上资金与产业热度",
    sources: ["CoinGlass", "Arkham", "DefiLlama", "Glassnode"],
    usage: "Funding rate、ETF inflow、钱包追踪、TVL、Stablecoin supply、链上活跃度，用来识别 Crypto 产业加速期。",
  },
];

const aiScoreRows = [
  {
    symbol: "MRVL",
    name: "Marvell",
    score: 92,
    phase: "主升浪前夜",
    conclusion: "AI 收入同比增长 120%，管理层表示推理需求超预期，期权端出现财报前 LEAP 建仓。",
    evidence: ["AI revenue mention", "Guidance raise", "LEAP Call 异动"],
  },
  {
    symbol: "VST",
    name: "Vistra",
    score: 89,
    phase: "机构建仓期",
    conclusion: "电力需求与数据中心 Capex 共振，板块 ETF 放量，暗池成交连续高于均值。",
    evidence: ["Datacenter Capex", "Dark Pool", "电力需求"],
  },
  {
    symbol: "CRCL",
    name: "Circle",
    score: 95,
    phase: "产业加速期",
    conclusion: "Stablecoin adoption 加速，社媒提及量扩大，链上活跃度和资金费率同步转强。",
    evidence: ["Stablecoin supply", "X 传播", "链上活跃度"],
  },
];

const signalTriggers = [
  {
    level: "高概率爆发信号",
    asset: "MRVL",
    score: 92,
    conditions: ["LEAP Call 暴增", "财报指引上调", "AI 产业数据加速", "社交热度开始扩散"],
    action: "推送强提醒，并进入 30 分钟人工复核队列。",
  },
  {
    level: "机构建仓信号",
    asset: "VST",
    score: 89,
    conditions: ["暗池成交放大", "板块 ETF 放量", "电力需求数据上修"],
    action: "推送观察窗提醒，等待财报或订单数据确认。",
  },
  {
    level: "产业扩散信号",
    asset: "CRCL",
    score: 95,
    conditions: ["Stablecoin 热度 7 天增长", "ETF inflow 改善", "Reddit 与 X 同步扩散"],
    action: "推送高优先级信号，并跟踪情绪是否过热。",
  },
];

const pushChannels = ["Telegram", "Discord", "邮件", "App Push"];

const watchlist = [
  {
    symbol: "NVDA",
    name: "英伟达",
    theme: "AI 算力",
    signals: {
      capital: { score: 96, evidence: ["LEAP Call 异动", "OI 暴增", "Gamma positioning"] },
      industry: { score: 94, evidence: ["AI 推理需求爆发", "GPU 涨价", "光模块缺货"] },
      earnings: { score: 91, evidence: ["指引上调", "AI revenue 持续披露", "Capex 预期上修"] },
      sentiment: { score: 83, evidence: ["KOL 高密度讨论", "新闻媒体集中报道"] },
    },
    thesis: "资金、产业、财报三段同时确认，处于戴维斯双击起点附近。",
  },
  {
    symbol: "688256",
    name: "寒武纪",
    theme: "国产芯片",
    signals: {
      capital: { score: 89, evidence: ["主力大单扫货", "换手率抬升", "板块 ETF 放量"] },
      industry: { score: 88, evidence: ["国产算力替代", "AI 推理需求爆发"] },
      earnings: { score: 74, evidence: ["订单预期改善", "收入结构改善"] },
      sentiment: { score: 79, evidence: ["机构关注度上行", "媒体报道升温"] },
    },
    thesis: "资金领先，产业逻辑强化，等待财报进一步验证持续性。",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    theme: "数字资产",
    signals: {
      capital: { score: 84, evidence: ["ETF 净流入改善", "期权偏斜转强", "OI 增长"] },
      industry: { score: 76, evidence: ["Stablecoin adoption", "机构配置需求"] },
      earnings: { score: 45, evidence: ["无财报验证，转看链上收入和 ETF 数据"] },
      sentiment: { score: 86, evidence: ["X 传播升温", "Reddit 热度暴增"] },
    },
    thesis: "更偏流动性与情绪驱动，缺少传统财报确认，适合单独风险框架。",
  },
  {
    symbol: "300750",
    name: "宁德时代",
    theme: "新能源",
    signals: {
      capital: { score: 76, evidence: ["板块 ETF 放量", "北向资金回流"] },
      industry: { score: 72, evidence: ["海外储能需求", "电力系统升级"] },
      earnings: { score: 78, evidence: ["毛利率修复", "订单预期改善"] },
      sentiment: { score: 58, evidence: ["讨论度回暖但未扩散"] },
    },
    thesis: "基本面开始修复，情绪尚未充分扩散，适合作为左侧观察。",
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    theme: "机器人",
    signals: {
      capital: { score: 69, evidence: ["期权成交放大", "趋势线附近承接"] },
      industry: { score: 82, evidence: ["机器人量产预期", "AI Agent 商业化"] },
      earnings: { score: 55, evidence: ["毛利率仍待拐点", "指引未明显上修"] },
      sentiment: { score: 74, evidence: ["KOL 讨论增加", "新闻事件驱动"] },
    },
    thesis: "产业想象力强，但财报验证不足，暂不进入最高优先级。",
  },
  {
    symbol: "0700.HK",
    name: "腾讯控股",
    theme: "平台经济",
    signals: {
      capital: { score: 62, evidence: ["回购支撑", "成交温和放大"] },
      industry: { score: 66, evidence: ["AI 产品嵌入", "游戏新品周期"] },
      earnings: { score: 73, evidence: ["利润率改善", "广告业务修复"] },
      sentiment: { score: 52, evidence: ["市场讨论度平稳"] },
    },
    thesis: "财报韧性较好，但缺少资金突击和情绪扩散。",
  },
];

const statusText = {
  critical: "强提醒",
  watch: "观察窗",
  quiet: "蓄势",
};

const statusRule = {
  critical: "资金、产业、财报形成共振",
  watch: "至少两段逻辑开始确认",
  quiet: "信号仍分散，等待触发",
};

const elements = {
  table: document.querySelector("#watchTable"),
  feed: document.querySelector("#signalFeed"),
  search: document.querySelector("#searchInput"),
  onlyCatalyst: document.querySelector("#onlyCatalyst"),
  segments: document.querySelectorAll(".segment"),
  total: document.querySelector("#metricTotal"),
  score: document.querySelector("#metricScore"),
  alerts: document.querySelector("#metricAlerts"),
  flow: document.querySelector("#metricFlow"),
  refresh: document.querySelector("#refreshButton"),
  export: document.querySelector("#exportButton"),
  dialog: document.querySelector("#watchDialog"),
  addWatch: document.querySelector("#addWatchButton"),
  form: document.querySelector("#watchForm"),
  radarTime: document.querySelector("#radarTime"),
  selectedAsset: document.querySelector("#selectedAsset"),
  modelLane: document.querySelector("#modelLane"),
  sourceGrid: document.querySelector("#sourceGrid"),
  moduleGrid: document.querySelector("#moduleGrid"),
  scoreBoard: document.querySelector("#scoreBoard"),
  triggerStack: document.querySelector("#triggerStack"),
  pushList: document.querySelector("#pushList"),
  simulateSignal: document.querySelector("#simulateSignalButton"),
  apiStatus: document.querySelector("#apiStatus"),
};

let activeFilter = "all";
let selectedSymbol = "NVDA";

function getSignal(item, key) {
  return item.signals[key] ?? { score: 0, evidence: [] };
}

function getScore(item) {
  return Math.round(
    signalModel.reduce((sum, model) => sum + getSignal(item, model.key).score * model.weight, 0)
  );
}

function getConfirmedCount(item) {
  return signalModel.filter((model) => getSignal(item, model.key).score >= 72).length;
}

function getStage(item) {
  const stages = signalModel.filter((model) => getSignal(item, model.key).score >= 72);
  return stages.length ? stages[stages.length - 1].key : "quiet";
}

function getStatus(item) {
  const score = getScore(item);
  const capital = getSignal(item, "capital").score;
  const industry = getSignal(item, "industry").score;
  const earnings = getSignal(item, "earnings").score;

  if (score >= 84 && capital >= 80 && industry >= 75 && earnings >= 72) return "critical";
  if (score >= 70 || getConfirmedCount(item) >= 2) return "watch";
  return "quiet";
}

function getFilteredList() {
  const query = elements.search.value.trim().toLowerCase();
  return watchlist.filter((item) => {
    const stage = getStage(item);
    const status = getStatus(item);
    const matchesFilter = activeFilter === "all" || activeFilter === status || activeFilter === stage;
    const matchesCatalyst = !elements.onlyCatalyst.checked || getSignal(item, "earnings").score >= 72;
    const matchesSearch = [item.symbol, item.name, item.theme, item.thesis]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return matchesFilter && matchesCatalyst && matchesSearch;
  });
}

function getStageLabel(key) {
  const model = signalModel.find((item) => item.key === key);
  return model ? model.label : "等待触发";
}

function renderModelLane() {
  elements.modelLane.innerHTML = signalModel
    .map(
      (model, index) => `
        <article class="logic-card">
          <div class="logic-index">${index + 1}</div>
          <div>
            <strong>${model.label}</strong>
            <span>权重 ${Math.round(model.weight * 100)}%</span>
          </div>
          <p>${model.examples.slice(0, 3).join(" / ")}</p>
        </article>
      `
    )
    .join("");
}

function renderRealtimeModules() {
  elements.moduleGrid.innerHTML = realtimeModules
    .map(
      (module) => `
        <article class="module-card">
          <div class="module-top">
            <div>
              <span class="panel-label">${module.focus}</span>
              <h3>${module.title}</h3>
            </div>
            <strong>${module.score}</strong>
          </div>
          <p>${module.insight}</p>
          <div class="tag-cloud">
            ${module.metrics.map((metric) => `<span>${metric}</span>`).join("")}
          </div>
          <div class="module-subgrid">
            <section>
              <strong>AI 筛选</strong>
              <p>${module.aiFilters.join(" / ")}</p>
            </section>
            <section>
              <strong>数据源</strong>
              <p>${module.sources.join(" / ")}</p>
            </section>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDataSources() {
  elements.sourceGrid.innerHTML = dataSourceGroups
    .map(
      (group) => `
        <article class="source-card">
          <div class="source-head">
            <div>
              <span class="panel-label">${group.role}</span>
              <h3>${group.category}</h3>
            </div>
          </div>
          <div class="source-list">
            ${group.sources.map((source) => `<span>${source}</span>`).join("")}
          </div>
          <p>${group.usage}</p>
        </article>
      `
    )
    .join("");
}

function renderScoreBoard() {
  elements.scoreBoard.innerHTML = aiScoreRows
    .map(
      (row) => `
        <article class="score-row">
          <div class="score-asset">
            <strong>${row.symbol}</strong>
            <span>${row.name}</span>
          </div>
          <div class="score-number">${row.score}</div>
          <div>
            <strong>${row.phase}</strong>
            <p>${row.conclusion}</p>
          </div>
          <div class="tag-cloud compact-tags">
            ${row.evidence.map((item) => `<span>${item}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderSignalEngine(activeIndex = 0) {
  elements.triggerStack.innerHTML = signalTriggers
    .map(
      (trigger, index) => `
        <article class="trigger-card ${index === activeIndex ? "is-live" : ""}">
          <div class="trigger-head">
            <div>
              <span class="panel-label">${trigger.level}</span>
              <h3>${trigger.asset}</h3>
            </div>
            <strong>${trigger.score}</strong>
          </div>
          <div class="condition-list">
            ${trigger.conditions.map((condition) => `<span>${condition}</span>`).join("")}
          </div>
          <p>${trigger.action}</p>
        </article>
      `
    )
    .join("");

  elements.pushList.innerHTML = pushChannels
    .map(
      (channel) => `
        <label class="push-item">
          <input type="checkbox" checked />
          <span>${channel}</span>
        </label>
      `
    )
    .join("");
}

function renderMetrics(list) {
  const source = list.length ? list : watchlist;
  const averageScore = Math.round(source.reduce((sum, item) => sum + getScore(item), 0) / source.length);
  const capitalLeaders = watchlist.filter((item) => getSignal(item, "capital").score >= 80).length;
  const davisCandidates = watchlist.filter((item) => getStatus(item) === "critical").length;

  elements.total.textContent = watchlist.length;
  elements.score.textContent = `${averageScore}%`;
  elements.alerts.textContent = davisCandidates;
  elements.flow.textContent = capitalLeaders;
}

function renderTable(list) {
  if (!list.length) {
    elements.table.innerHTML = '<div class="table-row empty-row">没有匹配的标的，调整筛选条件再看。</div>';
    return;
  }

  elements.table.innerHTML = list
    .map((item) => {
      const score = getScore(item);
      const status = getStatus(item);
      const stage = getStage(item);

      return `
        <article class="table-row asset-row ${item.symbol === selectedSymbol ? "is-selected" : ""}" data-symbol="${item.symbol}">
          <div class="asset">
            <div class="asset-badge">${item.symbol.slice(0, 2)}</div>
            <div>
              <strong>${item.name}</strong>
              <span class="row-sub">${item.symbol} · ${item.theme}</span>
            </div>
          </div>
          <div class="score-cell">
            <strong>${score}%</strong>
            <div class="score-bar" aria-label="爆发概率 ${score}%"><span style="width:${score}%"></span></div>
            <span class="row-sub">${getStageLabel(stage)}</span>
          </div>
          <div class="signal-grid">
            ${signalModel
              .map((model) => {
                const signal = getSignal(item, model.key);
                return `
                  <div class="signal-chip ${signal.score >= 80 ? "hot" : signal.score >= 72 ? "warm" : ""}" title="${signal.evidence.join(" / ")}">
                    <span>${model.short}</span>
                    <strong>${signal.score}</strong>
                  </div>
                `;
              })
              .join("")}
          </div>
          <span class="pill ${status}" title="${statusRule[status]}">${statusText[status]}</span>
          <div class="row-sub thesis">${item.thesis}</div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".asset-row").forEach((row) => {
    row.addEventListener("click", () => {
      selectedSymbol = row.dataset.symbol;
      render();
    });
  });
}

function renderSelectedAsset() {
  const item = watchlist.find((asset) => asset.symbol === selectedSymbol) ?? watchlist[0];
  const status = getStatus(item);
  const marketData = item.marketData;
  const marketHtml = marketData
    ? `
      <div class="market-strip">
        <span>价格 <strong>${marketData.price ? `$${Number(marketData.price).toFixed(2)}` : "待接入"}</strong></span>
        <span>涨跌 <strong>${Number(marketData.changePercent || 0).toFixed(2)}%</strong></span>
        <span>相对量 <strong>${Number(marketData.relativeVolume || 0).toFixed(2)}x</strong></span>
      </div>
    `
    : "";

  elements.selectedAsset.innerHTML = `
    <div class="detail-head">
      <div>
        <span class="panel-label">当前复核标的</span>
        <h3>${item.name}</h3>
        <p>${item.symbol} · ${item.theme}</p>
      </div>
      <span class="pill ${status}">${statusText[status]}</span>
    </div>
    ${marketHtml}
    <p class="detail-thesis">${item.thesis}</p>
    <div class="evidence-list">
      ${signalModel
        .map((model) => {
          const signal = getSignal(item, model.key);
          return `
            <section class="evidence-item">
              <div>
                <strong>${model.label}</strong>
                <span>${signal.score}/100</span>
              </div>
              <p>${signal.evidence.join("，")}</p>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderFeed(list) {
  const feedItems = [...list]
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, 4)
    .map((item, index) => {
      const strongest = [...signalModel].sort(
        (a, b) => getSignal(item, b.key).score - getSignal(item, a.key).score
      )[0];
      const minutes = 4 + index * 7;
      return `
        <article class="feed-item">
          <div>
            <strong>${item.name} · ${strongest.label}</strong>
            <p>${getSignal(item, strongest.key).evidence.slice(0, 2).join("，")}</p>
          </div>
          <span class="signal-meta">${minutes} 分钟前</span>
        </article>
      `;
    });
  elements.feed.innerHTML = feedItems.join("");
}

function render() {
  const list = getFilteredList();
  renderMetrics(list);
  renderTable(list);
  renderSelectedAsset();
  renderFeed(list);
}

function toFrontendAsset(asset) {
  return {
    symbol: asset.symbol,
    name: asset.name,
    theme: asset.theme,
    signals: asset.signals,
    marketData: asset.marketData,
    thesis: asset.thesis,
  };
}

async function loadOnlineSnapshot() {
  if (window.location.protocol === "file:") {
    elements.apiStatus.textContent = "本地样例数据";
    return;
  }

  try {
    elements.apiStatus.textContent = "连接线上 API";
    const response = await fetch("/api/monitoring", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("API unavailable");

    const snapshot = await response.json();
    if (!snapshot.assets?.length) throw new Error("Empty snapshot");

    watchlist.splice(0, watchlist.length, ...snapshot.assets.map(toFrontendAsset));
    selectedSymbol = watchlist[0].symbol;
    elements.apiStatus.textContent = `线上 API · ${snapshot.assets.length} 标的`;
    render();
  } catch {
    elements.apiStatus.textContent = "API 不可用 · 使用样例";
  }
}

elements.search.addEventListener("input", render);
elements.onlyCatalyst.addEventListener("change", render);

elements.segments.forEach((button) => {
  button.addEventListener("click", () => {
    elements.segments.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    activeFilter = button.dataset.filter;
    render();
  });
});

elements.refresh.addEventListener("click", () => {
  watchlist.forEach((item) => {
    signalModel.forEach((model) => {
      const signal = getSignal(item, model.key);
      const drift = Math.round(Math.random() * 8 - 3);
      signal.score = Math.max(25, Math.min(98, signal.score + drift));
    });
  });
  elements.radarTime.textContent = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  render();
});

elements.export.addEventListener("click", async () => {
  const lines = getFilteredList().map((item) => {
    const values = [
      item.symbol,
      item.name,
      item.theme,
      getScore(item),
      statusText[getStatus(item)],
      getStageLabel(getStage(item)),
      getSignal(item, "capital").score,
      getSignal(item, "industry").score,
      getSignal(item, "earnings").score,
      getSignal(item, "sentiment").score,
      item.thesis,
    ];
    return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
  });
  const text = [
    "代码,名称,赛道,爆发概率,状态,当前阶段,资金,产业,财报,情绪,判断",
    ...lines,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    elements.export.textContent = "已复制清单";
  } catch {
    const blob = new Blob([`\uFEFF${text}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alphapulse-watchlist.csv";
    link.click();
    URL.revokeObjectURL(url);
    elements.export.textContent = "已下载清单";
  }

  window.setTimeout(() => {
    elements.export.textContent = "导出观察清单";
  }, 1400);
});

elements.addWatch.addEventListener("click", () => {
  elements.dialog.showModal();
});

elements.form.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const formData = new FormData(elements.form);
  const score = Number(formData.get("score"));
  const symbol = String(formData.get("symbol")).trim().toUpperCase();

  watchlist.unshift({
    symbol,
    name: symbol,
    theme: String(formData.get("theme")).trim(),
    signals: {
      capital: { score, evidence: ["手动加入：等待期权、暗池、ETF 和大单数据确认"] },
      industry: { score: Math.max(40, score - 8), evidence: ["手动加入：等待产业逻辑跟踪"] },
      earnings: { score: Math.max(35, score - 16), evidence: ["手动加入：等待财报或经营数据验证"] },
      sentiment: { score: Math.max(30, score - 10), evidence: ["手动加入：等待社媒与新闻热度扩散"] },
    },
    thesis: "手动加入观察池，优先确认资金是否先动，再看产业和财报能否接力。",
  });

  selectedSymbol = symbol;
  elements.form.reset();
  elements.dialog.close();
  render();
});

document.querySelectorAll(".radar-dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    elements.search.value = dot.dataset.symbol;
    selectedSymbol = dot.dataset.symbol;
    render();
  });
});

renderModelLane();
renderDataSources();
renderRealtimeModules();
renderScoreBoard();
renderSignalEngine();
render();
loadOnlineSnapshot();

elements.simulateSignal.addEventListener("click", () => {
  const activeIndex = Math.floor(Math.random() * signalTriggers.length);
  renderSignalEngine(activeIndex);
  elements.simulateSignal.textContent = "已生成信号";
  window.setTimeout(() => {
    elements.simulateSignal.textContent = "模拟触发";
  }, 1400);
});
