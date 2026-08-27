#!/usr/bin/env node
/**
 * Tiny local proxy for MoneyControl's sector heat-map API.
 *
 * The dashboard runs in a browser, and MoneyControl's API doesn't send back
 * an Access-Control-Allow-Origin header for cross-site requests — so the
 * browser refuses the response before your JS ever sees it (that's the
 * "Failed to fetch" you hit). CORS is a browser-only rule; a plain
 * server-to-server request like this one isn't subject to it at all, so
 * this proxy fetches the data on your machine and hands it to the
 * dashboard over localhost, where you control the CORS headers.
 *
 * Requires only Node.js (no npm install).
 *
 * Run:
 *   node server.js
 *
 * Then in the dashboard, set "Proxy base URL" to:
 *   http://localhost:3001
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;

function fetchHeatMap({ indexId = '9', period = '1D', type = 'MM', subType = 'SE' }) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ period, type, indexId, subType }).toString();
    const url = `https://api.moneycontrol.com/mcapi/v1/indices/ad-ratio/heat-map?${qs}`;

    https.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        // A normal desktop UA — some APIs reject Node's default UA string outright.
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Upstream returned HTTP ${res.statusCode}`));
        }
        resolve(body);
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // Let the dashboard (running on whatever origin serves it) call this proxy.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (reqUrl.pathname !== '/api/heat-map') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found. Try /api/heat-map?indexId=9' }));
  }

  try {
    const params = Object.fromEntries(reqUrl.searchParams);
    const body = await fetchHeatMap(params);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Heat-map proxy listening on http://localhost:${PORT}`);
  console.log(`Try it directly:  http://localhost:${PORT}/api/heat-map?indexId=9`);
  console.log(`In the dashboard, set "Proxy base URL" to http://localhost:${PORT}`);
});
