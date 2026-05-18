async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Provider request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "text/plain,text/csv,*/*",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Provider request failed: ${response.status}`);
  }

  return response.text();
}

async function getPolygonQuote(symbol) {
  if (!process.env.POLYGON_API_KEY) return null;
  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`;
  return fetchJson(url);
}

async function getPolygonOptionChainSnapshot(symbol) {
  if (!process.env.POLYGON_API_KEY) return null;
  const url = `https://api.polygon.io/v3/snapshot/options/${encodeURIComponent(symbol)}?limit=250&apiKey=${process.env.POLYGON_API_KEY}`;
  return fetchJson(url);
}

async function getFinancialModelingPrepProfile(symbol) {
  if (!process.env.FMP_API_KEY) return null;
  const url = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${process.env.FMP_API_KEY}`;
  return fetchJson(url);
}

async function getFinancialModelingPrepQuote(symbol) {
  if (!process.env.FMP_API_KEY) return null;
  const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${process.env.FMP_API_KEY}`;
  return fetchJson(url);
}

async function getStooqQuote(symbol) {
  const stooqSymbol = `${String(symbol).trim().toLowerCase().replace(".", "-")}.us`;
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
  return fetchText(url);
}

async function getYahooChart(symbol) {
  const yahooSymbol = String(symbol).trim().toUpperCase().replace(".", "-");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
  return fetchJson(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 AlphaPulse/0.1",
    },
  });
}

async function getSecCompanyFacts(cik) {
  if (!cik) return null;
  const padded = String(cik).padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
  return fetchJson(url, {
    headers: {
      "User-Agent": process.env.SEC_USER_AGENT || "AlphaPulse monitor contact@example.com",
    },
  });
}

async function getDefiLlamaStablecoins() {
  return fetchJson("https://stablecoins.llama.fi/stablecoins?includePrices=true");
}

module.exports = {
  getDefiLlamaStablecoins,
  getFinancialModelingPrepProfile,
  getFinancialModelingPrepQuote,
  getPolygonOptionChainSnapshot,
  getPolygonQuote,
  getSecCompanyFacts,
  getStooqQuote,
  getYahooChart,
};
