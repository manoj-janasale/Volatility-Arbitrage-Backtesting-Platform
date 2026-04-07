from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from quant_trade.backtest import VolArbBacktester
from quant_trade.config import BacktestConfig

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    capital: float
    risk: float
    entry_z: float

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/simulate")
def simulate(req: SimulationRequest):
    config = BacktestConfig(
        capital=req.capital,
        risk_fraction=req.risk / 100,
        entry_z=req.entry_z,
    )

    backtester = VolArbBacktester(config)
    result = backtester.run()

    summary = result["summary"]
    equity_curve = result["equity_curve"]
    trades = result["trades"]

    return {
        "summary": summary,
        "equity_curve": [
            {
                "date": str(idx.date()) if hasattr(idx, "date") else str(idx),
                "value": float(val),
            }
            for idx, val in equity_curve.items()
        ],
        "trades": trades.fillna("").to_dict(orient="records"),
    }