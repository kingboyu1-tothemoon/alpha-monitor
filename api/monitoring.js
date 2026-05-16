const { enrichAsset } = require("./lib/scoring");
const { providerStatus, sampleAssets } = require("./lib/sample-data");

module.exports = function handler(req, res) {
  const assets = sampleAssets.map(enrichAsset);
  const critical = assets.filter((asset) => asset.status === "critical");

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({
    ok: true,
    mode: "sample-live-ready",
    generatedAt: new Date().toISOString(),
    providers: providerStatus,
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
