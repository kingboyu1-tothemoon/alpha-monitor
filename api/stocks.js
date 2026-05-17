const { enrichAsset } = require("./lib/scoring");
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
  const symbols = parseSymbols(req.query?.symbols);
  const assets = (await getStockAssets(symbols)).map(enrichAsset);

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({
    ok: true,
    mode: assets.length ? "live-stock-data" : "no-stock-provider-data",
    generatedAt: new Date().toISOString(),
    symbols,
    assets,
    missingApiKeys: {
      FMP_API_KEY: !Boolean(process.env.FMP_API_KEY),
      POLYGON_API_KEY: !Boolean(process.env.POLYGON_API_KEY),
    },
  });
};
