# AlphaPulse 股票评分

当前版本重新开始，只保留一个页面：

```text
搜索栏
→ 输入美股代码
→ 展示四维评分
```

## 评分模型

维度 1：资金，权重 35%

- OI 增长
- LEAP Call
- 暗池
- Gamma
- 大单连续性

维度 2：产业景气度，权重 25%

- AI Capex
- 电力需求
- Stablecoin adoption
- 行业订单

维度 3：财报拐点，权重 25%

- Revenue acceleration
- Guidance
- Margin expansion

维度 4：情绪扩散，权重 15%

- Reddit 热度
- X 提及量
- Google Trends

## 当前数据状态

当前已接入股票行情初筛：

- FinancialModelingPrep
- Polygon
- Stooq 延迟行情兜底

尚未完整接入：

- 期权 OI / LEAP Call / Gamma / 暗池
- 财报文本和电话会
- Reddit / X / Google Trends

所以现在的评分是“可运行的初筛版本”，后续每个维度会逐步接真实专项数据。
