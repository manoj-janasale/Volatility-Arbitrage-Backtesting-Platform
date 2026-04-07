# TradeZapp Quant Project — Volatility Arbitrage Backtesting Engine

A production-style Python project that demonstrates how to build, backtest, and evaluate an **options volatility arbitrage strategy** for index options. The strategy compares **implied volatility (IV)** against a **realized volatility (RV) forecast**, trades an ATM straddle when the spread is large enough, and applies **daily delta hedging** to reduce directional risk.

This repo is intentionally designed to be strong enough for:
- quant / strategy interviews
- GitHub portfolio showcase
- TradeZapp / systematic trading discussions
- learning Black-Scholes, Greeks, backtesting, and risk controls end to end

## What this project covers

- Black-Scholes option pricing
- Greeks: Delta, Gamma, Vega, Theta
- IV vs RV signal generation
- Daily mark-to-market option PnL
- Delta hedging using underlying exposure
- Transaction costs and slippage
- Risk controls: stop-loss, max holding days, position sizing
- Performance metrics: CAGR, Sharpe, max drawdown, hit rate
- Reproducible CLI workflow

## Strategy summary

Each trading day:
1. Estimate **realized volatility forecast** from trailing returns.
2. Infer a **market implied volatility proxy**.
   - By default, this project uses a realistic synthetic IV process built on top of realized vol so the system is fully reproducible.
   - You can later replace this with real NSE option-chain data or Kite Connect.
3. Compute the vol spread:
   - `spread = implied_vol - realized_vol_forecast`
4. Trade an ATM straddle when the spread crosses thresholds:
   - If IV is **too high**, short the straddle.
   - If IV is **too low**, long the straddle.
5. Delta hedge the net option exposure using the underlying.
6. Exit on mean reversion, stop-loss, or max holding days.

## Repo structure

```text
tradezapp_quant_project/
├── README.md
├── requirements.txt
├── pyproject.toml
├── run_backtest.py
├── src/
│   └── tradezapp_quant/
│       ├── __init__.py
│       ├── backtest.py
│       ├── black_scholes.py
│       ├── config.py
│       ├── data.py
│       ├── metrics.py
│       ├── signals.py
│       └── visualization.py
└── tests/
    └── test_black_scholes.py
```

## Quick start

### 1) Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # macOS / Linux
# .venv\Scripts\activate    # Windows
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Run the backtest

```bash
python run_backtest.py
```

This will:
- download index or ETF data from Yahoo Finance when available
- fall back to synthetic price data if download fails
- run the strategy
- save outputs under `output/`

## Example CLI options

```bash
python run_backtest.py --symbol ^NSEI --start 2021-01-01 --end 2025-12-31
python run_backtest.py --entry-z 1.0 --exit-z 0.2 --max-holding-days 7
python run_backtest.py --capital 1000000 --risk-fraction 0.02 --lot-size 50
```

## How to upgrade this to real NSE F&O data

For interviews, mention that this repo is the **research/backtesting core**, and productionizing it would involve replacing the synthetic IV layer with:
- NSE option-chain snapshots
- Zerodha Kite Connect market data
- historical minute/day-level option chain data vendor

Then:
- map real strikes and expiries
- infer IV from market option prices
- compute actual skew / surface
- add liquidity filters and execution assumptions

## Interview talking points

### Problem
Retail and institutional options often exhibit periods where **implied volatility deviates materially from expected realized volatility**. This creates systematic opportunities if priced and risk-managed correctly.

### Approach
I built a Python backtesting engine that compares IV with an RV forecast, trades ATM straddles on large deviations, delta-hedges daily, and evaluates performance after slippage, transaction costs, and risk controls.

### Result
On a reproducible research setup, the strategy produces a full equity curve, trade log, risk metrics, and sensitivity to thresholds. The implementation is modular enough to swap in real NSE option-chain data and broker APIs.

## Good form answer you can use

**Describe your most impactful quant project (problem → approach → result)**

> I built a Python-based options volatility arbitrage backtesting engine for index options. The problem was to systematically detect when option-implied volatility diverged from expected realized volatility and convert that into a tradeable strategy. I implemented Black-Scholes pricing, Greeks, an IV-vs-RV signal layer, a delta-hedged ATM straddle strategy, and a backtesting engine with transaction costs, stop-losses, and holding-period constraints. The result was a reproducible research pipeline that generates trade logs, equity curves, Sharpe ratio, drawdown statistics, and can be extended to real NSE F&O data and broker APIs.

## Suggested truthful form entries

- **GitHub / portfolio**: upload this repo to GitHub and paste the repo link
- **Certifications**: `None` unless you really have one
- **Current CTC**: your actual number only
- **Expected CTC**: give a realistic range based on the role and market
- **Notice Period**: your actual notice period

## Disclaimer

This project is for research and educational use. It is not investment advice.
