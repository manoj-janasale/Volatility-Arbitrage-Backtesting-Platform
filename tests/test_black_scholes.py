from tradezapp_quant.black_scholes import call_price, put_price


def test_put_call_parity_close() -> None:
    spot = 100.0
    strike = 100.0
    rate = 0.05
    vol = 0.2
    t = 1.0
    call = call_price(spot, strike, rate, vol, t)
    put = put_price(spot, strike, rate, vol, t)
    lhs = call - put
    rhs = spot - strike * (2.718281828459045 ** (-rate * t))
    assert abs(lhs - rhs) < 1e-3
