const { enrichAsset } = require("./lib/scoring");
const { sampleAssets } = require("./lib/sample-data");

module.exports = async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.authorization?.replace("Bearer ", "");

  if (expected && provided !== expected) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const assets = sampleAssets.map(enrichAsset);

  res.status(200).json({
    ok: true,
    refreshedAt: new Date().toISOString(),
    processed: assets.length,
    nextStep: "Persist this payload to a database such as Supabase, Neon, Postgres, or Vercel KV.",
    assets,
  });
};
