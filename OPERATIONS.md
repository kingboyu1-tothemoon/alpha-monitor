# 真实线上监控系统路线

当前项目已经具备静态前端 + Serverless API 骨架，可以部署到 Vercel 后运行：

```text
/api/health      服务健康检查
/api/monitoring  前端读取的监控快照
/api/refresh     定时刷新入口
```

## 第一阶段：可上线监控 MVP

目标：先让网站在线运行，并让前端从 API 读取数据。

需要做：

1. 部署到 Vercel。
2. 配置 `.env.example` 中的环境变量。
3. 打开 `/api/health` 确认服务可用。
4. 打开首页，确认右上角显示“线上 API”。

## 第二阶段：接真实数据源

优先顺序：

1. Polygon / Tradier：期权链、OI、IV、成交量。
2. FinancialModelingPrep：公司基础数据、财务数据。
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
- Vercel Cron 配置
- 前端线上 API 读取
- 本地样例降级
