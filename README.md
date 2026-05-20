# Alpha Monitor

当前模块：资金流入流出监控。

输入股票代码后，系统调用 Tradier Options API，返回：

- 总 OI
- LEAP Call OI
- Put/Call OI Ratio
- Gamma Exposure
- 平均 IV
- 扫描合约数量

需要在 Vercel 配置：

```text
TRADIER_TOKEN=你的 Tradier token
```

可选：

```text
TRADIER_BASE_URL=https://api.tradier.com/v1
```

## Tradier 连接测试

部署后打开：

```text
/api/tradier-health?symbol=TSLA
```

如果返回 401/403，请检查 `TRADIER_TOKEN` 和 Tradier 数据权限。

注意：OI 增长需要保存历史快照后才能计算。本版本先展示当前截面。
