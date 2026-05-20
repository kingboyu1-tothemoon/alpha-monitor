const TRADIER_BASE_URL = process.env.TRADIER_BASE_URL || "https://api.tradier.com/v1";

async function checkTradier(path) {
  const response = await fetch(`${TRADIER_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.TRADIER_TOKEN || ""}`,
    },
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

  if (!process.env.TRADIER_TOKEN) {
    res.status(200).json({
      ok: false,
      error: "TRADIER_TOKEN is not configured.",
    });
    return;
  }

  const expirations = await checkTradier(`/markets/options/expirations?symbol=${encodeURIComponent(symbol)}`);

  res.status(200).json({
    ok: expirations.ok,
    provider: "Tradier",
    symbol,
    expirations,
    interpretation:
      expirations.status === 200
        ? "Tradier options expirations endpoint works."
        : expirations.status === 401 || expirations.status === 403
          ? "Tradier rejected the token or data permission."
          : "Tradier request failed. Check symbol, token, or endpoint availability.",
  });
};
