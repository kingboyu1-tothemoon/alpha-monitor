# Alpha Monitor

一个先不依赖付费 API 的美股资金异动初筛工具。

## 当前思路

真实的期权 OI、LEAP Call、Gamma、暗池和逐笔大单数据通常需要 Polygon、Tradier、Unusual Whales 等付费或带权限的数据源。当前版本先换成免费延迟行情方案，用价格和成交量做代理判断：

- 最新涨跌幅
- 最新成交量
- 20 日平均成交量
- 相对成交量
- 5 日趋势
- 20 日趋势
- 成交额

系统会输出一个 0-100 的资金评分，并给出“强流入倾向、流入观察、中性观察、流出或降温”的判断。

同时，页面会给出一组非 API 的定性资金结构判断：

- 期权 OI 变化
- LEAP Call 布局
- Gamma 影响
- 暗池成交
- 大单连续性

这些结论不是付费期权链或暗池数据返回的事实，而是基于放量、价格方向、趋势连续性和成交额做出的低到中等置信度推断。

## 第二模块：产业景气度

搜索股票后，系统会把标的归入一个产业主题，并选择一个行业 ETF 或主题 ETF 作为代理，计算产业景气度评分：

- 行业代理 5 日趋势
- 行业代理 20 日趋势
- 行业代理相对成交量
- 行业代理相对 QQQ 的 20 日强弱
- 个股相对行业代理的 20 日强弱

示例：`NVDA` 会优先归入 AI 半导体 / 算力基础设施，并用 `SMH` 作为行业代理；`TSLA` 会归入电动车 / 自动驾驶 / 智能制造，并用 `DRIV` 作为代理。

这个模块同样不使用付费产业数据库，属于“免费行情 + 产业映射表”的景气度近似判断。

## 第三模块：财报拐点

搜索股票后，系统会调用 Nasdaq 的公开财务数据，评估三个维度：

- Revenue acceleration：用最近季度收入环比增速，以及环比增速是否继续加速来判断
- Guidance：用 Nasdaq earnings calendar 里的 EPS consensus 相对去年同期变化做低置信度代理
- Margin expansion：用收入和成本计算毛利率，并判断毛利率是否扩张

注意：当前 Guidance 不是 earnings call transcript 或管理层正式指引原文，只是市场预期代理。后续如果接入财报电话会文本或公司 press release，可以把这一项升级为真正的管理层指引分析。

## 数据源

后端接口 `/api/capital-flow` 当前使用 Nasdaq 的无 key 延迟历史行情接口。

这些数据不需要配置 key，但可能存在延迟、限流、覆盖不完整或稳定性不足的问题，适合做初筛，不适合当作交易级别的数据源。

## 本地和线上

直接打开 `index.html` 可以看到页面，但本地 `file://` 页面不能调用 Vercel Serverless API。

部署到 Vercel 后，用线上地址测试：

```text
/api/capital-flow?symbol=TSLA
```

## 后续升级路线

等免费版产品逻辑跑顺后，再逐步接回更专业的数据层：

- 期权 OI / LEAP Call / Gamma：Tradier、Polygon、CBOE
- 暗池 / 大单：Polygon、Unusual Whales、Benzinga
- 新闻和舆情：Benzinga、Google Trends、Reddit、X
- 财报拐点：SEC EDGAR、FinancialModelingPrep、earnings transcript
