const sampleAssets = [
  {
    symbol: "MRVL",
    name: "Marvell",
    theme: "AI Infra",
    signals: {
      capital: { score: 91, evidence: ["财报前 LEAP Call 建仓", "OI 三日连续增长", "Sweep Order 放大"] },
      industry: { score: 89, evidence: ["AI 推理需求超预期", "Datacenter Capex 上修"] },
      earnings: { score: 92, evidence: ["AI 收入同比增长 120%", "Guidance raise", "管理层上修需求展望"] },
      sentiment: { score: 78, evidence: ["KOL 讨论增加", "新闻报道集中"] },
    },
    thesis: "资金提前布局，财报确认 AI 收入加速，处于主升浪前夜。",
  },
  {
    symbol: "VST",
    name: "Vistra",
    theme: "AI Power",
    signals: {
      capital: { score: 88, evidence: ["暗池成交连续高于均值", "板块 ETF 放量"] },
      industry: { score: 91, evidence: ["数据中心电力需求上修", "天然气与核电订单升温"] },
      earnings: { score: 81, evidence: ["利润率改善", "管理层上调全年预期"] },
      sentiment: { score: 69, evidence: ["机构报告密度提升"] },
    },
    thesis: "电力需求和机构建仓共振，等待舆情进一步扩散。",
  },
  {
    symbol: "CRCL",
    name: "Circle",
    theme: "Stablecoin",
    signals: {
      capital: { score: 93, evidence: ["资金费率改善", "链上大额钱包流入"] },
      industry: { score: 95, evidence: ["Stablecoin supply 增长", "支付采用率提升"] },
      earnings: { score: 74, evidence: ["交易收入改善", "储备收益稳定"] },
      sentiment: { score: 91, evidence: ["X 提及量快速扩散", "Reddit 热度增长"] },
    },
    thesis: "产业与情绪同时加速，属于 Crypto 产业扩散信号。",
  },
];

const providerStatus = [
  { group: "股票 / 期权", providers: ["Polygon", "Tradier", "CBOE", "Nasdaq", "FinancialModelingPrep"], status: "ready-for-key" },
  { group: "财报", providers: ["SEC EDGAR", "AlphaSense", "BamSEC"], status: "ready-for-key" },
  { group: "新闻", providers: ["Benzinga", "Reuters", "Bloomberg", "The Information"], status: "ready-for-key" },
  { group: "Crypto", providers: ["CoinGlass", "Arkham", "DefiLlama", "Glassnode"], status: "ready-for-key" },
];

module.exports = {
  providerStatus,
  sampleAssets,
};
