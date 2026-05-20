async function checkEndpoint(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "";
  }
  return {
    ok: response.ok,
    status: response.status,
    body: body.slice(0, 500),
  };
}

module.exports = async function handler(req, res) {
  const symbol = String(req.query?.symbol || "TSLA").trim().toUpperCase();

  if (!process.env.POLYGON_API_KEY) {
    res.status(200).json({
      ok: false,
      error: "POLYGON_API_KEY is not configured.",
    });
    return;
  }

  const apiKey = process.env.POLYGON_API_KEY;
  const stockUrl = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${apiKey}`;
  const optionsUrl = `https://api.polygon.io/v3/snapshot/options/${encodeURIComponent(symbol)}?limit=1&apiKey=${apiKey}`;

  const [stock, options] = await Promise.all([checkEndpoint(stockUrl), checkEndpoint(optionsUrl)]);

  res.status(200).json({
    ok: stock.ok || options.ok,
    symbol,
    stock,
    options,
    interpretation: {
      stock:
        stock.status === 200
          ? "Stock endpoint works."
          : "Stock endpoint failed. Check API key.",
      options:
        options.status === 200
          ? "Options Snapshot endpoint works."
          : options.status === 403
            ? "Options Snapshot is forbidden. Upgrade Polygon plan or enable options access."
            : "Options Snapshot failed. Check endpoint, plan, or symbol.",
    },
  });
};
