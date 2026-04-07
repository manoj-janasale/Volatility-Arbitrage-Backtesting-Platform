from __future__ import annotations

import argparse
import json
from pathlib import Path

from tradezapp_quant.backtest import VolArbBacktester
from tradezapp_quant.config import BacktestConfig


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the TradeZapp volatility arbitrage backtest")
    parser.add_argument("--symbol", default="^NSEI")
    parser.add_argument("--start", default="2021-01-01")
    parser.add_argument("--end", default="2025-12-31")
    parser.add_argument("--entry-z", type=float, default=1.0)
    parser.add_argument("--exit-z", type=float, default=0.2)
    parser.add_argument("--capital", type=float, default=1_000_000.0)
    parser.add_argument("--risk-fraction", type=float, default=0.02)
    parser.add_argument("--lot-size", type=int, default=50)
    parser.add_argument("--max-holding-days", type=int, default=7)
    parser.add_argument("--output-dir", default="output")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    config = BacktestConfig(
        symbol=args.symbol,
        start=args.start,
        end=args.end,
        entry_z=args.entry_z,
        exit_z=args.exit_z,
        capital=args.capital,
        risk_fraction=args.risk_fraction,
        lot_size=args.lot_size,
        max_holding_days=args.max_holding_days,
    )

    result = VolArbBacktester(config).run(output_dir=args.output_dir)
    summary = result["summary"]

    print("\n=== Backtest Summary ===")
    print(json.dumps(summary, indent=2, default=str))
    print(f"\nSaved outputs to: {Path(args.output_dir).resolve()}")


if __name__ == "__main__":
    main()
