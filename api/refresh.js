const { enrichAsset } = require("./lib/scoring");
const { sampleAssets } = require("./lib/sample-data");
const { DEFAULT_SYMBOLS, getStockAssets, normalizeStockSymbol } = require("./lib/stock-data");

function parseSymbols(value) {
  if (!value) return DEFAULT_SYMBOLS;
  return String(value)
    .split(",")
    .map((symbol) => normalizeStockSymbol(symbol))
    .filter(Boolean)
    .slice(0, 20);
}

module.exports = async function handler(req, res) {
  const expected = process.env.REFRESH_SECRET || process.env.CRON_SECRET;
  const provided = req.headers.authorization?.replace("Bearer ", "");

  if (expected && provided !== expected) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const requestedSymbols = parseSymbols(req.query?.symbols);
  const liveStockAssets = await getStockAssets(requestedSymbols);
  const assets = (liveStockAssets.length ? liveStockAssets : sampleAssets).map(enrichAsset);

  res.status(200).json({
    ok: true,
    mode: liveStockAssets.length ? "live-stock-data" : "sample-fallback",
    refreshedAt: new Date().toISOString(),
    processed: assets.length,
    nextStep: "Persist this payload to a database such as Supabase, Neon, Postgres, or Vercel KV.",
    assets,
  });
};
