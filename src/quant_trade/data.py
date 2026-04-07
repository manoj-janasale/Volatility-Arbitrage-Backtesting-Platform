from __future__ import annotations

import numpy as np
import pandas as pd
import yfinance as yf

from .config import BacktestConfig


class MarketDataLoader:
    def __init__(self, config: BacktestConfig):
        self.config = config

    def load_underlying(self) -> pd.DataFrame:
        try:
            data = yf.download(self.config.symbol, start=self.config.start, end=self.config.end, auto_adjust=True, progress=False)
            if data is not None and not data.empty:
                df = data.rename(columns=str.lower)
                close_series = df["close"]
                if hasattr(close_series, "ndim") and getattr(close_series, "ndim", 1) > 1:
                    close_series = close_series.iloc[:, 0]
                result = pd.DataFrame(index=df.index)
                result["close"] = pd.to_numeric(close_series, errors="coerce")
                result = result.dropna().sort_index()
                if len(result) > 100:
                    result["source"] = "yfinance"
                    return result
        except Exception:
            pass
        return self._generate_synthetic_underlying()

    def _generate_synthetic_underlying(self) -> pd.DataFrame:
        dates = pd.bdate_range(self.config.start, self.config.end)
        rng = np.random.default_rng(self.config.fallback_seed)
        mu = 0.0003
        sigma = self.config.fallback_daily_vol
        rets = rng.normal(mu, sigma, len(dates))
        prices = 18000 * np.exp(np.cumsum(rets))
        df = pd.DataFrame(index=dates)
        df["close"] = prices
        df["source"] = "synthetic"
        return df


def build_research_dataset(config: BacktestConfig) -> pd.DataFrame:
    loader = MarketDataLoader(config)
    df = loader.load_underlying().copy()
    df["returns"] = np.log(df["close"] / df["close"].shift(1))

    annualization = np.sqrt(252)
    rv = df["returns"].rolling(config.rv_lookback).std() * annualization
    rv = rv.clip(lower=0.05, upper=1.0)
    df["realized_vol_forecast"] = rv

    # Synthetic but realistic IV process: anchored to RV + persistent spread + noise
    rng = np.random.default_rng(config.fallback_seed)
    spread_noise = rng.normal(0.0, config.iv_noise_scale, len(df))
    persistent = np.zeros(len(df))
    for i in range(1, len(df)):
        persistent[i] = config.iv_mean_reversion_strength * persistent[i - 1] + spread_noise[i]

    df["implied_vol"] = (df["realized_vol_forecast"].bfill() + 0.03 + persistent).clip(lower=0.08, upper=1.2)
    df["vol_spread"] = df["implied_vol"] - df["realized_vol_forecast"]
    df["spread_zscore"] = (df["vol_spread"] - df["vol_spread"].rolling(60).mean()) / df["vol_spread"].rolling(60).std()
    df = df.dropna().copy()
    return df
