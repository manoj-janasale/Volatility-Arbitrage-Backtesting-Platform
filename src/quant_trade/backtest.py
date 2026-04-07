from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
import pandas as pd

from .black_scholes import straddle_price_and_delta
from .config import BacktestConfig
from .data import build_research_dataset
from .metrics import compute_performance_metrics, summarize_trades
from .signals import SignalEngine
from .visualization import save_equity_curve, save_vol_spread_plot


@dataclass(slots=True)
class Position:
    entry_date: pd.Timestamp
    side: int
    strike: float
    qty: int
    entry_price: float
    entry_option_value: float
    entry_underlying: float
    time_to_expiry_years: float
    hedge_qty: float
    total_entry_cost: float
    reason: str


class VolArbBacktester:
    def __init__(self, config: BacktestConfig):
        self.config = config
        self.signal_engine = SignalEngine(config)

    def _round_strike(self, spot: float) -> float:
        step = self.config.strike_rounding
        return round(spot / step) * step

    def _transaction_cost(self, notional: float, bps: float) -> float:
        return abs(notional) * (bps / 10_000)

    def run(self, output_dir: str | Path = "output") -> dict[str, object]:
        df = build_research_dataset(self.config)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        cash = self.config.capital
        equity_records: list[tuple[pd.Timestamp, float]] = []
        trade_records: list[dict[str, object]] = []

        position: Position | None = None
        prev_close: float | None = None

        for date, row in df.iterrows():
            spot = float(row["close"])
            iv = float(row["implied_vol"])
            rv = float(row["realized_vol_forecast"])
            _ = rv

            daily_hedge_pnl = 0.0
            if position is not None and prev_close is not None:
                daily_hedge_pnl = -position.hedge_qty * (spot - prev_close)
                cash += daily_hedge_pnl

            mtm_option_value = 0.0
            unrealized_total = 0.0
            holding_days = 0
            unrealized_pnl_fraction = 0.0

            if position is not None:
                holding_days = (date - position.entry_date).days
                remaining_days = max(self.config.days_to_expiry - holding_days, 1)
                ttm = remaining_days / 252.0
                straddle_px, straddle_delta = straddle_price_and_delta(
                    spot=spot,
                    strike=position.strike,
                    rate=self.config.risk_free_rate,
                    vol=iv,
                    time_to_expiry=ttm,
                )
                mtm_option_value = position.side * position.qty * straddle_px
                hedge_value = -position.hedge_qty * spot
                current_gross = mtm_option_value + hedge_value
                entry_gross = position.side * position.qty * position.entry_option_value - position.hedge_qty * position.entry_underlying
                unrealized_total = (current_gross - entry_gross) - position.total_entry_cost
                unrealized_pnl_fraction = unrealized_total / max(self.config.capital, 1.0)

                should_exit, exit_reason = self.signal_engine.should_exit(row, holding_days, unrealized_pnl_fraction)
                if should_exit:
                    option_notional = abs(position.qty * straddle_px)
                    option_exit_cost = self._transaction_cost(option_notional, self.config.option_cost_bps + self.config.slippage_bps)
                    hedge_exit_notional = abs(position.hedge_qty * spot)
                    hedge_exit_cost = self._transaction_cost(hedge_exit_notional, self.config.hedge_cost_bps)

                    realized_pnl = unrealized_total - option_exit_cost - hedge_exit_cost
                    cash += position.side * position.qty * straddle_px
                    cash += position.hedge_qty * spot
                    cash -= option_exit_cost + hedge_exit_cost

                    trade_records.append(
                        {
                            "entry_date": position.entry_date,
                            "exit_date": date,
                            "side": "LONG_VOL" if position.side == 1 else "SHORT_VOL",
                            "strike": position.strike,
                            "qty": position.qty,
                            "entry_price": position.entry_price,
                            "exit_price": straddle_px,
                            "holding_days": holding_days,
                            "entry_reason": position.reason,
                            "exit_reason": exit_reason,
                            "realized_pnl": realized_pnl,
                        }
                    )
                    position = None
                    mtm_option_value = 0.0

            if position is None:
                signal = self.signal_engine.maybe_enter(row)
                if signal is not None:
                    strike = self._round_strike(spot)
                    ttm = self.config.days_to_expiry / 252.0
                    straddle_px, net_delta = straddle_price_and_delta(
                        spot=spot,
                        strike=strike,
                        rate=self.config.risk_free_rate,
                        vol=iv,
                        time_to_expiry=ttm,
                    )

                    capital_at_risk = self.config.capital * self.config.risk_fraction
                    per_lot_cost = max(straddle_px * self.config.lot_size, 1.0)
                    lots = max(int(capital_at_risk // per_lot_cost), 1)
                    qty = lots * self.config.lot_size

                    option_notional = qty * straddle_px
                    hedge_qty = signal.side * qty * net_delta
                    hedge_notional = abs(hedge_qty * spot)
                    option_entry_cost = self._transaction_cost(option_notional, self.config.option_cost_bps + self.config.slippage_bps)
                    hedge_entry_cost = self._transaction_cost(hedge_notional, self.config.hedge_cost_bps)
                    total_entry_cost = option_entry_cost + hedge_entry_cost

                    cash -= signal.side * qty * straddle_px
                    cash += hedge_qty * spot
                    cash -= total_entry_cost

                    position = Position(
                        entry_date=date,
                        side=signal.side,
                        strike=strike,
                        qty=qty,
                        entry_price=straddle_px,
                        entry_option_value=straddle_px,
                        entry_underlying=spot,
                        time_to_expiry_years=ttm,
                        hedge_qty=hedge_qty,
                        total_entry_cost=total_entry_cost,
                        reason=signal.reason,
                    )

            portfolio_value = cash
            if position is not None:
                holding_days = max((date - position.entry_date).days, 0)
                remaining_days = max(self.config.days_to_expiry - holding_days, 1)
                ttm = remaining_days / 252.0
                straddle_px, _ = straddle_price_and_delta(
                    spot=spot,
                    strike=position.strike,
                    rate=self.config.risk_free_rate,
                    vol=iv,
                    time_to_expiry=ttm,
                )
                portfolio_value += position.side * position.qty * straddle_px
                portfolio_value -= position.hedge_qty * spot

            equity_records.append((date, portfolio_value))
            prev_close = spot

        equity_curve = pd.Series({date: value for date, value in equity_records}).sort_index()
        trades = pd.DataFrame(trade_records)
        perf = compute_performance_metrics(equity_curve)
        trade_summary = summarize_trades(trades)

        save_equity_curve(equity_curve, output_path / "equity_curve.png")
        save_vol_spread_plot(df, output_path / "vol_spread.png")
        df.to_csv(output_path / "research_dataset.csv")
        trades.to_csv(output_path / "trades.csv", index=False)
        equity_curve.to_csv(output_path / "equity_curve.csv", header=["portfolio_value"])

        summary = {
            "config": asdict(self.config),
            "performance": perf,
            "trade_summary": trade_summary,
            "num_data_points": int(len(df)),
            "data_source": str(df["source"].iloc[0]),
        }
        pd.Series(summary["performance"]).to_csv(output_path / "performance_metrics.csv")
        pd.Series(summary["trade_summary"]).to_csv(output_path / "trade_summary.csv")
        return {
            "summary": summary,
            "equity_curve": equity_curve,
            "trades": trades,
            "dataset": df,
        }
