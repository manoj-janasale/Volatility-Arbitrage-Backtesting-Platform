from __future__ import annotations

import math
from dataclasses import dataclass

from scipy.stats import norm


@dataclass(slots=True)
class Greeks:
    delta: float
    gamma: float
    vega: float
    theta: float


def _validate_inputs(spot: float, strike: float, time_to_expiry: float, vol: float) -> None:
    if spot <= 0:
        raise ValueError("spot must be positive")
    if strike <= 0:
        raise ValueError("strike must be positive")
    if time_to_expiry <= 0:
        raise ValueError("time_to_expiry must be positive")
    if vol <= 0:
        raise ValueError("vol must be positive")


def d1(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> float:
    _validate_inputs(spot, strike, time_to_expiry, vol)
    return (math.log(spot / strike) + (rate + 0.5 * vol**2) * time_to_expiry) / (vol * math.sqrt(time_to_expiry))


def d2(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> float:
    return d1(spot, strike, rate, vol, time_to_expiry) - vol * math.sqrt(time_to_expiry)


def call_price(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> float:
    d1_val = d1(spot, strike, rate, vol, time_to_expiry)
    d2_val = d2(spot, strike, rate, vol, time_to_expiry)
    return spot * norm.cdf(d1_val) - strike * math.exp(-rate * time_to_expiry) * norm.cdf(d2_val)


def put_price(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> float:
    d1_val = d1(spot, strike, rate, vol, time_to_expiry)
    d2_val = d2(spot, strike, rate, vol, time_to_expiry)
    return strike * math.exp(-rate * time_to_expiry) * norm.cdf(-d2_val) - spot * norm.cdf(-d1_val)


def call_greeks(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> Greeks:
    d1_val = d1(spot, strike, rate, vol, time_to_expiry)
    d2_val = d2(spot, strike, rate, vol, time_to_expiry)
    pdf = norm.pdf(d1_val)
    sqrt_t = math.sqrt(time_to_expiry)

    delta = norm.cdf(d1_val)
    gamma = pdf / (spot * vol * sqrt_t)
    vega = spot * pdf * sqrt_t
    theta = -(spot * pdf * vol) / (2 * sqrt_t) - rate * strike * math.exp(-rate * time_to_expiry) * norm.cdf(d2_val)
    return Greeks(delta=delta, gamma=gamma, vega=vega, theta=theta)


def put_greeks(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> Greeks:
    d1_val = d1(spot, strike, rate, vol, time_to_expiry)
    d2_val = d2(spot, strike, rate, vol, time_to_expiry)
    pdf = norm.pdf(d1_val)
    sqrt_t = math.sqrt(time_to_expiry)

    delta = norm.cdf(d1_val) - 1
    gamma = pdf / (spot * vol * sqrt_t)
    vega = spot * pdf * sqrt_t
    theta = -(spot * pdf * vol) / (2 * sqrt_t) + rate * strike * math.exp(-rate * time_to_expiry) * norm.cdf(-d2_val)
    return Greeks(delta=delta, gamma=gamma, vega=vega, theta=theta)


def straddle_price_and_delta(spot: float, strike: float, rate: float, vol: float, time_to_expiry: float) -> tuple[float, float]:
    call = call_price(spot, strike, rate, vol, time_to_expiry)
    put = put_price(spot, strike, rate, vol, time_to_expiry)
    call_delta = call_greeks(spot, strike, rate, vol, time_to_expiry).delta
    put_delta = put_greeks(spot, strike, rate, vol, time_to_expiry).delta
    return call + put, call_delta + put_delta
