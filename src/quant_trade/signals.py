from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .config import BacktestConfig


@dataclass(slots=True)
class Signal:
    date: pd.Timestamp
    side: int  # +1 long straddle, -1 short straddle
    reason: str


class SignalEngine:
    def __init__(self, config: BacktestConfig):
        self.config = config

    def maybe_enter(self, row: pd.Series) -> Signal | None:
        z = row["spread_zscore"]
        if z <= -self.config.entry_z:
            return Signal(date=row.name, side=1, reason="IV below RV forecast")
        if z >= self.config.entry_z:
            return Signal(date=row.name, side=-1, reason="IV above RV forecast")
        return None

    def should_exit(self, row: pd.Series, holding_days: int, unrealized_pnl_fraction: float) -> tuple[bool, str]:
        z = row["spread_zscore"]
        if abs(z) <= self.config.exit_z:
            return True, "vol spread mean reversion"
        if unrealized_pnl_fraction <= -self.config.stop_loss_fraction:
            return True, "stop loss"
        if holding_days >= self.config.max_holding_days:
            return True, "max holding period"
        return False, ""
