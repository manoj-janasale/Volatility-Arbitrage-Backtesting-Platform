from __future__ import annotations

import numpy as np
import pandas as pd


def compute_performance_metrics(equity_curve: pd.Series) -> dict[str, float]:
    returns = equity_curve.pct_change().dropna()
    if returns.empty:
        return {
            "total_return": 0.0,
            "cagr": 0.0,
            "sharpe": 0.0,
            "max_drawdown": 0.0,
            "volatility": 0.0,
        }

    total_return = equity_curve.iloc[-1] / equity_curve.iloc[0] - 1
    years = max(len(returns) / 252.0, 1 / 252.0)
    cagr = (equity_curve.iloc[-1] / equity_curve.iloc[0]) ** (1 / years) - 1
    volatility = returns.std() * np.sqrt(252)
    sharpe = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0.0

    running_max = equity_curve.cummax()
    drawdown = equity_curve / running_max - 1
    max_drawdown = drawdown.min()

    return {
        "total_return": float(total_return),
        "cagr": float(cagr),
        "sharpe": float(sharpe),
        "max_drawdown": float(max_drawdown),
        "volatility": float(volatility),
    }


def summarize_trades(trades: pd.DataFrame) -> dict[str, float]:
    if trades.empty:
        return {
            "num_trades": 0,
            "hit_rate": 0.0,
            "avg_trade_pnl": 0.0,
            "profit_factor": 0.0,
        }

    pnl = trades["realized_pnl"]
    wins = pnl[pnl > 0]
    losses = pnl[pnl < 0]
    profit_factor = wins.sum() / abs(losses.sum()) if not losses.empty and abs(losses.sum()) > 0 else float("inf")
    return {
        "num_trades": int(len(trades)),
        "hit_rate": float((pnl > 0).mean()),
        "avg_trade_pnl": float(pnl.mean()),
        "profit_factor": float(profit_factor),
    }
