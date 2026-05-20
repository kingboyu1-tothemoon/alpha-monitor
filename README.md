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

## Polygon 403 排查

如果页面显示：

```text
Polygon request failed: 403
```

通常代表 API key 可以被识别，但当前 plan 没有 Options Snapshot 权限。

部署后打开：

```text
/api/polygon-health?symbol=TSLA
```

看返回里的 `stock` 和 `options`：

- `stock.status = 200`，但 `options.status = 403`：股票行情可用，但 Options Snapshot 没权限。
- `stock.status = 403`：API key 本身或环境变量可能有问题。
- `options.status = 200`：期权接口可用，页面应能正常查询。
