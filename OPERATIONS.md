# 真实线上监控系统路线

当前项目已经具备静态前端 + Serverless API 骨架，可以部署到 Vercel 后运行：

```text
/api/health      服务健康检查
/api/monitoring  前端读取的监控快照
/api/refresh     手动刷新入口
```

## 第一阶段：可上线监控 MVP

目标：先让网站在线运行，并让前端从 API 读取数据。

需要做：

1. 部署到 Vercel。
2. 配置 `.env.example` 中的环境变量。
3. 打开 `/api/health` 确认服务可用。
4. 打开首页，确认右上角显示“线上 API”。
5. 打开 `/api/stocks?symbols=MRVL,VST,NVDA`，确认股票数据源能返回数据。
6. 在首页搜索栏输入任意美股代码并按 Enter，确认标的会被评分并加入监控池。

## 第二阶段：接真实数据源

优先顺序：

1. FinancialModelingPrep：先接股票报价、公司名称、行业、成交量。
2. Polygon / Tradier：再接期权链、OI、IV、成交量。
3. SEC EDGAR：10-K、10-Q、8-K。
4. DefiLlama / CoinGlass：Stablecoin、Funding rate、ETF inflow。
5. Benzinga / Reuters / Bloomberg / The Information：新闻催化剂。

接入方式：

```text
provider API
→ 标准化 raw signal
→ scoring.js 计算四维评分
→ 保存到数据库
→ /api/monitoring 返回最新快照
```

## 搜索栏即时评分

线上部署后，首页搜索栏支持输入任意美股代码并按 Enter：

```text
NVDA
MRVL
VST
TSLA
```

前端会调用：

```text
/api/stocks?symbols=NVDA
```

然后按四维模型计算：

```text
资金 35%
产业 25%
财报 25%
情绪 15%
```

当前第一版股票评分已经接入报价、涨跌幅、成交量、公司名称、行业信息。期权 OI、LEAP Call、暗池、财报文本、新闻与舆情还在后续接入队列里，所以目前任意 ticker 的评分是“股票行情初筛分”，不是完整爆发分。

## 第三阶段：加数据库

推荐：

- Supabase Postgres：最适合快速做产品。
- Neon Postgres：轻量、适合 Vercel。
- Vercel KV：适合缓存最新快照，不适合复杂分析。

建议表：

```text
assets
signals
scores
alerts
provider_runs
```

## 第四阶段：AI 分析

AI 不应该直接替代数据源，而是做三件事：

1. 从财报、新闻、电话会里抽取证据。
2. 判断信号是否和产业催化一致。
3. 给出可解释评分和风险缺口。

输出格式建议：

```json
{
  "symbol": "MRVL",
  "score": 92,
  "stage": "主升浪前夜",
  "evidence": ["AI revenue mention", "Guidance raise", "LEAP Call 异动"],
  "risk": "情绪尚未完全扩散"
}
```

## 第五阶段：推送

触发条件：

```text
资金 >= 85
产业 >= 75
财报 >= 72
总分 >= 84
```

推送通道：

- Telegram Bot
- Discord Webhook
- 邮件
- App Push

## 当前已完成的工程基础

- API 骨架
- 评分引擎
- 数据源适配器占位
- 股票数据 API：`/api/stocks?symbols=MRVL,VST,NVDA`
- 手动刷新 API：`/api/refresh`
- 前端线上 API 读取
- 本地样例降级
