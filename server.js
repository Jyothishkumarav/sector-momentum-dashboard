#!/usr/bin/env node
/**
 * Sector Momentum Dashboard & MoneyControl API Proxy Server
 * Serves both the frontend dashboard HTML and the API proxy.
 * Zero external npm dependencies (pure Node.js standard library).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

// Load dashboard HTML into memory on startup
function loadDashboardHtml() {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'sector-momentum-dashboard (2).html'),
    path.join(__dirname, 'sector-momentum-dashboard.html')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`[Dashboard] Loaded UI from: ${path.basename(file)} (${(content.length / 1024).toFixed(1)} KB)`);
        return content;
      } catch (err) {
        console.error(`[Dashboard] Error reading ${file}:`, err.message);
      }
    }
  }
  return '<h1>Dashboard HTML file not found</h1><p>Please ensure index.html exists in the application root.</p>';
}

let cachedHtml = loadDashboardHtml();

function fetchHeatMap({ indexId = '9', period = '1D', type = 'MM', subType = 'SE' }) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ period, type, indexId, subType }).toString();
    const url = `https://api.moneycontrol.com/mcapi/v1/indices/ad-ratio/heat-map?${qs}`;

    https.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
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

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Healthcheck endpoint
  if (reqUrl.pathname === '/healthz' || reqUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
  }

  // Favicon empty response
  if (reqUrl.pathname === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  // API Proxy for MoneyControl HeatMap
  if (reqUrl.pathname === '/api/heat-map') {
    try {
      const params = Object.fromEntries(reqUrl.searchParams);
      const body = await fetchHeatMap(params);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
      console.log(`[Proxy] 200 OK -> /api/heat-map indexId=${params.indexId || '9'} period=${params.period || '1D'}`);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }));
      console.error(`[Proxy] 502 Bad Gateway -> ${err.message}`);
    }
    return;
  }

  // Serve Frontend Dashboard HTML for root or any page route
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache'
  });
  res.end(cachedHtml);
  console.log(`[Dashboard] 200 OK -> ${reqUrl.pathname}`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`  Sector Momentum Dashboard & Proxy Server`);
  console.log(`  Listening on: http://0.0.0.0:${PORT}`);
  console.log(`  Health check: http://0.0.0.0:${PORT}/healthz`);
  console.log(`=================================================`);
});
