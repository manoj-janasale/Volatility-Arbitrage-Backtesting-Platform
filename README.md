# 🚀 Volatility Arbitrage Backtesting & Simulation Platform

A full-stack quantitative trading platform that models, backtests, and visualizes an **options volatility arbitrage strategy** using Python (backend) and a modern React/Next.js dashboard (frontend).

This system simulates how institutional desks identify and trade **mispricing between implied volatility (IV) and realized volatility (RV)**, with realistic execution assumptions, risk controls, and performance analytics.

---

## 🧠 Core Idea

Options are often mispriced relative to actual market movement.

This platform detects those inefficiencies and simulates a strategy that:
- trades ATM straddles when IV deviates from RV
- hedges directional exposure (delta hedging)
- manages risk through position sizing and stop-losses
- evaluates performance using institutional-grade metrics

---

## ✨ Features

### ⚙️ Quant Engine (Python)
- Black-Scholes pricing model
- Greeks: Delta, Gamma, Vega, Theta
- IV vs RV signal generation
- Delta-hedged options strategy
- Transaction cost + slippage modeling
- Risk controls:
  - stop-loss
  - max holding period
  - capital-based position sizing
- Performance metrics:
  - CAGR
  - Sharpe ratio
  - max drawdown
  - hit rate
  - profit factor

---

### 📊 Interactive Dashboard (Frontend)
- Virtual capital simulation
- Real-time strategy execution trigger
- Equity curve visualization
- Trade-level P&L insights
- Risk analytics (drawdown, exposure, safety score)
- Portfolio allocation breakdown

---

## 🖥️ Product Preview

### 🎯 Strategy Controls & Simulation
![Strategy Controls](./docs/screenshots/controls.png)

---

### 📈 Portfolio Growth (Equity Curve)
![Equity Curve](./docs/screenshots/equity.png)

---

### 🧩 Portfolio Allocation & Metrics
![Metrics](./docs/screenshots/metrics.png)

---

## 🏗️ Architecture
Volatility-Arbitrage-Backtesting-Platform/
│
├── api.py                  # FastAPI backend (strategy execution)
├── run_backtest.py         # CLI backtesting entrypoint
├── requirements.txt
│
├── src/quant_trade/        # Core quant engine
│   ├── backtest.py         # Strategy + execution logic
│   ├── black_scholes.py    # Pricing model
│   ├── signals.py          # IV vs RV logic
│   ├── metrics.py          # Performance analytics
│   ├── data.py             # Data ingestion (yfinance + fallback)
│   ├── config.py           # Strategy configuration
│   └── visualization.py    # Output generation
│
├── frontend/               # Next.js dashboard
│   └── app/
│       └── dashboard.tsx   # UI layer
│
└── output/                 # Backtest outputs (charts, CSVs)

---

## ⚡ How It Works

### 1. Signal Generation
- Estimate **realized volatility (RV)** from historical returns
- Generate **implied volatility (IV)** proxy
- Compute:
   spread = IV - RV

---

### 2. Trade Execution
- If IV >> RV → **Short Volatility (sell straddle)**
- If IV << RV → **Long Volatility (buy straddle)**

---

### 3. Risk Management
- Delta hedging using underlying
- Stop-loss enforcement
- Max holding period exit
- Capital-based position sizing

---

### 4. Output
- Equity curve
- Trade logs
- Performance metrics
- Risk analytics

---

## 🚀 Getting Started

### 1. Setup Backend

```bash
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

2. Run Backend API
   uvicorn api:app --reload

   Backend runs at:
   process.env.NEXT_PUBLIC_API_URL

3. Run Frontend
   cd frontend/volatility-arbitrage-backtesting-platform
   npm install
   npm run dev

   Frontend runs at:
     http://localhost:3000

🔌 API Endpoint

Run Simulation
   POST /simulate

   Request Body
   {
      "capital": 1000000,
      "risk": 2,
      "entry_z": 1
   }

   Response 
   {
      "equity_curve": [...],
      "trades": [...],
      "metrics": {
         "sharpe": 0.79,
         "max_drawdown": -0.91,
         "hit_rate": 0.93
  }


