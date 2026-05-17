# AlphaPulse 拐点监控原型

这是一个高潜力标的爆发拐点监控网站原型，当前版本为纯前端静态页面，可直接打开 `index.html` 体验。

## 核心逻辑

网站不把“爆发”看成单一价格突破，而是拆成四段接力：

1. 资金先动：LEAP Call 异动、OI 暴增、暗池成交、Gamma positioning、主力大单扫货、板块 ETF 放量。
2. 产业强化：AI 推理需求爆发、电力短缺、Stablecoin adoption、AI Agent 商业化、机器人量产、GPU 涨价、光模块缺货。
3. 财报验证：指引上调、毛利率拐点、Capex 暴增、backlog 增长、AI revenue 首次披露。
4. 情绪扩散：KOL 讨论、Reddit 热度、X 传播、新闻媒体集中报道。

当前评分权重为：资金 35%，产业 25%，财报 25%，情绪 15%。只有当资金、产业、财报同时确认时，才进入“戴维斯候选 / 强提醒”。

## 当前能力

- 标的监控池：展示代码、名称、赛道、爆发概率、状态和触发原因。
- 实时监控层：拆成期权异动、财报拐点、行业景气度、舆情热度四个入口。
- 期权异动监控：围绕 LEAP Call、OI、Put/Call、Sweep、Dark Pool、IV、Gamma Exposure 做主力布局评分。
- 财报拐点监控：围绕 Revenue acceleration、Capex increase、Guidance raise、AI revenue mention、Gross margin expansion、backlog growth 做基本面验证评分。
- 行业景气度监控：覆盖 AI Infra、Crypto、机器人等赛道的供需、订单、价格和链上数据。
- 舆情热度监控：覆盖 Reddit、X、YouTube、新闻、Google Trends 的提及增长、情绪倾向、热词变化、KOL 扩散速度。
- 四段链路评分：展示资金、产业、财报、情绪四类信号的独立分数。
- AI 评分系统：输出爆发评分、阶段、AI 结论和关键证据，而不是只展示原始数据。
- 爆发信号引擎：当 LEAP Call 暴增、财报指引上调、产业数据加速、社交热度扩散同时出现时，生成高概率爆发信号。
- 推送通道：预留 Telegram、Discord、邮件、App Push。
- 复核面板：点击标的后查看每一段信号的证据列表。
- 拐点雷达：把高优先级信号集中在右侧雷达和信号流。
- 筛选与搜索：支持按阶段、财报验证、代码、名称、赛道过滤。
- 模拟刷新：用于演示分数滚动变化和提醒状态更新。
- 添加标的：可手动把新标的加入当前监控池。
- 导出清单：优先复制 CSV，复制不可用时自动下载文件。

## 后续接真实数据的建议

1. 数据源层：行情、成交量、资金流、公告、研报、社媒热度、新闻催化剂。
2. 信号层：按资金、产业、财报、情绪四段归类，保留证据、时间戳、来源可信度。
3. 评分层：把各类信号归一化为 0-100 的爆发概率，并保留每次评分原因。
4. 提醒层：站内提醒、邮件、企业微信、Telegram 或飞书。
5. 复盘层：记录每个提醒后的 1 日、3 日、10 日表现，用来优化权重。

## 数据源接入顺序建议

1. 先接期权和行情：Unusual Whales、Polygon、Tradier、CBOE、Nasdaq API。
2. 再接财报文本：SEC EDGAR、earnings call transcript、Finviz、AlphaVantage。
3. 再接行业指标：AI Capex、电力需求、Stablecoin supply、ETF inflow、机器人订单。
4. 最后接舆情：Reddit、X、YouTube、新闻、Google Trends。

优先级建议：先把“资金先动 + 财报验证”做准，再扩展舆情热度。舆情通常更适合确认扩散，而不是单独作为买入依据。

## 推荐数据源矩阵

股票 / 期权：
Polygon、Tradier、CBOE、Nasdaq、FinancialModelingPrep。

财报：
SEC EDGAR、AlphaSense、BamSEC。

新闻：
Benzinga、Reuters、Bloomberg、The Information。

Crypto：
CoinGlass、Arkham、DefiLlama、Glassnode。

这些源的分工是：股票 / 期权负责捕捉资金先动，财报源负责验证基本面拐点，新闻源负责确认催化剂和共识扩散，Crypto 源负责链上资金、Stablecoin、ETF inflow 和产业热度。

## 上线部署

当前项目是纯静态站点，可以直接部署到 Vercel、Netlify 或 GitHub Pages。详细步骤见 `DEPLOY.md`。

如果要变成真正可用的线上监控系统，优先部署到 Vercel。项目已包含 Serverless API、评分引擎、定时刷新入口和环境变量模板。运营路线见 `OPERATIONS.md`。

股票数据已开始接入：

```text
/api/stocks?symbols=MRVL,VST,NVDA
/api/monitoring?symbols=MRVL,VST,NVDA
```

配置 `FMP_API_KEY` 后可读取 FinancialModelingPrep 的报价、公司名称、行业和成交量；配置 `POLYGON_API_KEY` 后可补充 Polygon 前收盘与成交量数据。
