#!/usr/bin/env node
/**
 * Sector Momentum Dashboard & MoneyControl API Proxy Server
 * Serves both the frontend dashboard and the API proxy.
 * Zero external npm dependencies (pure Node.js standard library).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

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

function getHtmlFilePath() {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'sector-momentum-dashboard (2).html'),
    path.join(__dirname, 'sector-momentum-dashboard.html')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return null;
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

  // Health check endpoint for Docker / cloud platforms
  if (reqUrl.pathname === '/healthz' || reqUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
  }

  // Serve Frontend Dashboard HTML
  if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
    const htmlPath = getHtmlFilePath();
    if (htmlPath) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(htmlPath).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Dashboard HTML file not found.');
  }

  // API Proxy for MoneyControl HeatMap
  if (reqUrl.pathname === '/api/heat-map') {
    try {
      const params = Object.fromEntries(reqUrl.searchParams);
      const body = await fetchHeatMap(params);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`  Sector Momentum Dashboard & Proxy Server`);
  console.log(`  Listening on: http://0.0.0.0:${PORT}`);
  console.log(`  Health check: http://0.0.0.0:${PORT}/healthz`);
  console.log(`=================================================`);
});
