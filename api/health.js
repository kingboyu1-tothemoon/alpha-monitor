module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "alphapulse-monitor",
    timestamp: new Date().toISOString(),
    requiredEnv: {
      POLYGON_API_KEY: Boolean(process.env.POLYGON_API_KEY),
      FMP_API_KEY: Boolean(process.env.FMP_API_KEY),
      SEC_USER_AGENT: Boolean(process.env.SEC_USER_AGENT),
      REFRESH_SECRET: Boolean(process.env.REFRESH_SECRET || process.env.CRON_SECRET),
    },
  });
};
