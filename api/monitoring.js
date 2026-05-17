const { enrichAsset } = require("./lib/scoring");
const { providerStatus, sampleAssets } = require("./lib/sample-data");
const { DEFAULT_SYMBOLS, getStockAssets } = require("./lib/stock-data");

function parseSymbols(value) {
  if (!value) return DEFAULT_SYMBOLS;
  return String(value)
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20);
}

module.exports = async function handler(req, res) {
  const requestedSymbols = parseSymbols(req.query?.symbols);
  const liveStockAssets = await getStockAssets(requestedSymbols);
  const sourceAssets = liveStockAssets.length ? liveStockAssets : sampleAssets;
  const assets = sourceAssets.map(enrichAsset);
  const critical = assets.filter((asset) => asset.status === "critical");

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({
    ok: true,
    mode: liveStockAssets.length ? "live-stock-data" : "sample-fallback",
    generatedAt: new Date().toISOString(),
    providers: providerStatus,
    requestedSymbols,
    missingApiKeys: {
      FMP_API_KEY: !Boolean(process.env.FMP_API_KEY),
      POLYGON_API_KEY: !Boolean(process.env.POLYGON_API_KEY),
    },
    assets,
    summary: {
      total: assets.length,
      critical: critical.length,
      averageScore: Math.round(assets.reduce((sum, asset) => sum + asset.score, 0) / assets.length),
    },
    alerts: critical.map((asset) => ({
      symbol: asset.symbol,
      score: asset.score,
      stage: asset.stage,
      message: `${asset.symbol}: ${asset.thesis}`,
    })),
  });
};
