module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { indexId = '9', period = '1D', type = 'MM', subType = 'SE' } = req.query;
  const qs = new URLSearchParams({ period, type, indexId, subType }).toString();
  const url = `https://api.moneycontrol.com/mcapi/v1/indices/ad-ratio/heat-map?${qs}`;

  try {
    const upstreamRes = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: `Upstream HTTP ${upstreamRes.status}` });
    }

    const data = await upstreamRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
};
