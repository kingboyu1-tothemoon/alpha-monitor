# Alpha Monitor

当前模块：资金流入流出监控。

输入股票代码后，系统调用 Polygon Options Snapshot，返回：

- 总 OI
- LEAP Call OI
- Put/Call OI Ratio
- Gamma Exposure
- 平均 IV
- 扫描合约数量

需要在 Vercel 配置：

```text
POLYGON_API_KEY=你的 Polygon API key
```

注意：OI 增长需要保存历史快照后才能计算。本版本先展示当前截面。
