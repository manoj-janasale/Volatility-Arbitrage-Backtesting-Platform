from dataclasses import dataclass


@dataclass(slots=True)
class BacktestConfig:
    symbol: str = "^NSEI"
    start: str = "2021-01-01"
    end: str = "2025-12-31"
    risk_free_rate: float = 0.06

    # Signal parameters
    rv_lookback: int = 20
    iv_noise_scale: float = 0.08
    iv_mean_reversion_strength: float = 0.35
    entry_z: float = 1.0
    exit_z: float = 0.2

    # Option / execution setup
    days_to_expiry: int = 21
    strike_rounding: int = 50
    lot_size: int = 50
    capital: float = 1_000_000.0
    risk_fraction: float = 0.02

    # Costs and risk control
    option_cost_bps: float = 10.0
    hedge_cost_bps: float = 2.0
    slippage_bps: float = 5.0
    stop_loss_fraction: float = 0.03
    max_holding_days: int = 7

    # Synthetic fallback
    fallback_seed: int = 42
    fallback_daily_vol: float = 0.012
