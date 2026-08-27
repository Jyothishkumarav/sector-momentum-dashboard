# Sector Momentum Dashboard & CORS Proxy

A real-time sector momentum heatmap and dual-timeframe confluence scanner for Indian stock indices (Nifty 50, Nifty 100, Nifty 200, Midcap 100, Smallcap 50).

---

## ⚡ Features

- **Single-Index Heatmap**: Real-time sector performance and constituent stock gainers/losers.
- **Multi-Index Overview**: Scan broad market breadth across all 5 major indices simultaneously.
- **Multi-Index Summary**: Compact at-a-glance strip of sectors crossing momentum thresholds.
- **Dual-Timeframe Confluence Scanner**: Filter sectors and individual stocks trending positively across both short-term (1D / 5D) and long-term (5D / 1M / 3M) timeframes.
- **Built-in CORS Proxy**: Built using pure Node.js standard library with zero external npm dependencies.
- **Auto Same-Origin Routing**: Automatically proxies requests without manual configuration when hosted online.

---

## 🚀 Quick Start (Local)

### Using Node.js (No install needed)
```bash
node server.js
```
Open **`http://localhost:3001`** in your browser.

---

### Using Docker
```bash
# Build and run with Docker
docker build -t sector-momentum-dashboard .
docker run -d -p 3001:3001 --name sector-momentum-dashboard sector-momentum-dashboard

# Or with Docker Compose
docker compose up -d
```
Open **`http://localhost:3001`** in your browser.

---

## 🌐 Free Cloud Deployment

### Deploy on Render.com (100% Free)
1. Fork or push this repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Environment**: `Node` (or `Docker`)
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.

---

## 📄 License
MIT
