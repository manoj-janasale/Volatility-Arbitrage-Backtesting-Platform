from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def save_equity_curve(equity_curve: pd.Series, path: str | Path) -> None:
    plt.figure(figsize=(11, 6))
    equity_curve.plot()
    plt.title("Strategy Equity Curve")
    plt.xlabel("Date")
    plt.ylabel("Portfolio Value")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def save_vol_spread_plot(df: pd.DataFrame, path: str | Path) -> None:
    plt.figure(figsize=(11, 6))
    df["vol_spread"].plot(label="IV - RV")
    plt.axhline(0.0, linestyle="--")
    plt.title("Volatility Spread")
    plt.xlabel("Date")
    plt.ylabel("Spread")
    plt.legend()
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
