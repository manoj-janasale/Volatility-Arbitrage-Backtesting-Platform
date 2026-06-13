"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Play,
  Wallet,
  ShieldCheck,
  Activity,
  TrendingUp,
  AlertTriangle,
  BadgeIndianRupee,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

type Performance = {
  total_return: number;
  cagr: number;
  sharpe: number;
  max_drawdown: number;
  volatility: number;
};

type TradeSummary = {
  num_trades: number;
  hit_rate: number;
  avg_trade_pnl: number;
  profit_factor: number;
};

type Summary = {
  config?: Record<string, unknown>;
  performance: Performance;
  trade_summary: TradeSummary;
  num_data_points: number;
  data_source: string;
};

type EquityPoint = {
  date: string;
  value: number;
};

type Trade = {
  entry_date?: string;
  exit_date?: string;
  side?: string;
  strike?: number;
  qty?: number;
  entry_price?: number;
  exit_price?: number;
  holding_days?: number;
  entry_reason?: string;
  exit_reason?: string;
  realized_pnl?: number;
};

type SimulationResponse = {
  summary: Summary;
  equity_curve: EquityPoint[];
  trades: Trade[];
};

const allocationData = [
  { name: "Long Vol", value: 42 },
  { name: "Short Vol", value: 38 },
  { name: "Cash", value: 20 },
];

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Dashboard() {
  const [capital, setCapital] = useState("1000000");
  const [riskPct, setRiskPct] = useState([2]);
  const [entryZ, setEntryZ] = useState([1]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResponse | null>(null);

  const numericCapital = Number(capital || 0);

  const derivedRiskSnapshot = useMemo(() => {
    const base = numericCapital || 1000000;
    const liveExposure = Math.round(base * (riskPct[0] / 100) * 4.8);
    const safety = Math.max(12, 100 - riskPct[0] * 18);

    return {
      liveExposure,
      safety,
    };
  }, [numericCapital, riskPct]);

  const projectedFinalValue = result
    ? (numericCapital || 1000000) * (1 + result.summary.performance.total_return)
    : null;

  const projectedPnl = result
    ? (numericCapital || 1000000) * result.summary.performance.total_return
    : null;

  const winRatePct = result
    ? result.summary.trade_summary.hit_rate * 100
    : null;

  const metricCards = result
    ? [
        {
          title: "Sharpe Ratio",
          value: result.summary.performance.sharpe.toFixed(2),
          icon: Gauge,
          sub: "Risk-adjusted return",
        },
        {
          title: "Hit Rate",
          value: `${(result.summary.trade_summary.hit_rate * 100).toFixed(1)}%`,
          icon: TrendingUp,
          sub: "Winning trades",
        },
        {
          title: "Max Drawdown",
          value: `${(result.summary.performance.max_drawdown * 100).toFixed(1)}%`,
          icon: AlertTriangle,
          sub: "Peak-to-trough risk",
        },
        {
          title: "Trades",
          value: String(result.summary.trade_summary.num_trades),
          icon: Activity,
          sub: "Historical executions",
        },
      ]
    : [
        { title: "Sharpe Ratio", value: "—", icon: Gauge, sub: "Risk-adjusted return" },
        { title: "Hit Rate", value: "—", icon: TrendingUp, sub: "Winning trades" },
        { title: "Max Drawdown", value: "—", icon: AlertTriangle, sub: "Peak-to-trough risk" },
        { title: "Trades", value: "—", icon: Activity, sub: "Historical executions" },
      ];

  const tradePnLData =
    result?.trades?.map((trade, index) => ({
      trade: `T${index + 1}`,
      pnl: Number(trade.realized_pnl ?? 0),
    })) ?? [];

  const recentTradesData = result?.trades?.slice(-6).reverse() ?? [];
  const equityCurveData = result?.equity_curve ?? [];

  const runSimulation = async () => {
    try {
      setStarted(true);
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capital: Number(capital),
          risk: riskPct[0],
          entry_z: entryZ[0],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Simulation failed");
      }

      const data: SimulationResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge className="rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20">
                    Quant Sandbox
                  </Badge>
                  <Badge variant="secondary" className="rounded-full bg-sky-500/20 text-sky-200 hover:bg-sky-500/20">
                    Virtual Money Only
                  </Badge>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  Volatility Arbitrage Backtesting & Simulation Platform
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  A user-friendly front end for your quant engine. Add virtual capital, run the backend strategy,
                  and visualize P&amp;L, risk, trades, and portfolio movement in a polished dashboard.
                </p>
              </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="grid min-w-[280px] grid-cols-2 gap-3"
              >
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="text-xs text-slate-400">Virtual Portfolio</div>
                  <div className="mt-2 text-2xl font-semibold">{formatINR(numericCapital || 1000000)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="text-xs text-slate-400">Simulated Outcome</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {projectedFinalValue !== null ? formatINR(projectedFinalValue) : "—"}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Wallet className="h-5 w-5" />
                  Strategy Controls
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Normal users can configure virtual money and risk preferences before starting the simulation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="capital">Virtual Capital</Label>
                  <Input
                    id="capital"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value.replace(/[^0-9]/g, ""))}
                    className="rounded-2xl border-white/10 bg-slate-900/80"
                    placeholder="1000000"
                  />
                  <p className="text-xs text-slate-400">Start with any paper-trading amount. Example: 1000000 = ₹10 lakh.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Risk Per Trade</Label>
                    <span className="text-sm text-slate-300">{riskPct[0]}%</span>
                  </div>
                  <Slider min={1} max={10} step={1} value={riskPct} onValueChange={setRiskPct} />
                  <p className="text-xs text-slate-400">Higher risk increases potential return but also drawdown.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Entry Z-Score Threshold</Label>
                    <span className="text-sm text-slate-300">{entryZ[0].toFixed(1)}</span>
                  </div>
                  <Slider min={0.5} max={2} step={0.1} value={entryZ} onValueChange={setEntryZ} />
                  <p className="text-xs text-slate-400">Higher threshold means fewer but more selective trades.</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    Risk Snapshot
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-slate-300">
                        <span>Safety Score</span>
                        <span>{derivedRiskSnapshot.safety}/100</span>
                      </div>
                      <Progress value={derivedRiskSnapshot.safety} className="h-2 bg-slate-800" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Estimated Live Exposure</span>
                      <span>{formatINR(derivedRiskSnapshot.liveExposure)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={runSimulation}
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {loading ? "Running Simulation..." : "Run Virtual Simulation"}
                </Button>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <Card className="rounded-3xl border-white/10 bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 text-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-300">Current Capital</div>
                      <div className="mt-2 text-2xl font-semibold">{formatINR(numericCapital || 1000000)}</div>
                    </div>
                    <BadgeIndianRupee className="h-6 w-6 text-emerald-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-white/10 bg-gradient-to-br from-sky-500/20 to-sky-700/10 text-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-300">Projected Final Value</div>
                      <div className="mt-2 text-2xl font-semibold">
                        {projectedFinalValue !== null ? formatINR(projectedFinalValue) : "—"}
                      </div>
                    </div>
                    <TrendingUp className="h-6 w-6 text-sky-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-white/10 bg-gradient-to-br from-violet-500/20 to-violet-700/10 text-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-300">Projected P&amp;L</div>
                      <div className="mt-2 text-2xl font-semibold">
                        {projectedPnl !== null ? formatINR(projectedPnl) : "—"}
                      </div>
                    </div>
                    <Activity className="h-6 w-6 text-violet-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-white/10 bg-gradient-to-br from-amber-500/20 to-amber-700/10 text-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-300">Win Rate Estimate</div>
                      <div className="mt-2 text-2xl font-semibold">
                        {winRatePct !== null ? `${winRatePct.toFixed(1)}%` : "—"}
                      </div>
                    </div>
                    <Gauge className="h-6 w-6 text-amber-300" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/5">
                <TabsTrigger value="overview" className="rounded-2xl">Overview</TabsTrigger>
                <TabsTrigger value="trades" className="rounded-2xl">Trades</TabsTrigger>
                <TabsTrigger value="risk" className="rounded-2xl">Risk</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
                  <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                    <CardHeader>
                      <CardTitle>Portfolio Growth</CardTitle>
                      <CardDescription className="text-slate-400">
                        Historical equity curve returned by the backend strategy engine.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={equityCurveData}>
                          <defs>
                            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="date" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                          <Tooltip formatter={(value) => formatINR(Number(value))} />
                          <Area type="monotone" dataKey="value" stroke="currentColor" fill="url(#equityFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                    <CardHeader>
                      <CardTitle>Portfolio Allocation</CardTitle>
                      <CardDescription className="text-slate-400">Illustrative allocation split for the simulation view.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                            {allocationData.map((entry, index) => (
                              <Cell key={entry.name} fill={["#34d399", "#38bdf8", "#a78bfa"][index % 3]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {metricCards.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                      <motion.div
                        key={metric.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-xs text-slate-400">{metric.title}</div>
                                <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
                                <div className="mt-1 text-xs text-slate-500">{metric.sub}</div>
                              </div>
                              <div className="rounded-2xl bg-slate-900/80 p-2">
                                <Icon className="h-5 w-5 text-slate-300" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="trades" className="mt-6 space-y-6">
                <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                  <CardHeader>
                    <CardTitle>Recent Trade Outcomes</CardTitle>
                    <CardDescription className="text-slate-400">
                      Real trades returned by your backend backtester.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {recentTradesData.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">
                        Run a simulation to see trade history.
                      </div>
                    ) : (
                      recentTradesData.map((trade, index) => (
                        <motion.div
                          key={`${trade.entry_date}-${index}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Trade #{recentTradesData.length - index}</span>
                              <Badge className="rounded-full bg-white/10 text-slate-200 hover:bg-white/10">
                                {trade.side ?? "N/A"}
                              </Badge>
                              <Badge variant="secondary" className="rounded-full bg-slate-800 text-slate-300 hover:bg-slate-800">
                                Closed
                              </Badge>
                            </div>
                            <div className="mt-2 text-sm text-slate-300">
                              Strike {trade.strike ?? "—"} • Qty {trade.qty ?? "—"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Entry {trade.entry_date?.slice(0, 10) ?? "—"} → Exit {trade.exit_date?.slice(0, 10) ?? "—"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400">PnL</div>
                            <div
                              className={`text-lg font-semibold ${
                                Number(trade.realized_pnl ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"
                              }`}
                            >
                              {formatINR(Number(trade.realized_pnl ?? 0))}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                  <CardHeader>
                    <CardTitle>Trade-by-Trade P&amp;L</CardTitle>
                    <CardDescription className="text-slate-400">Backend-generated realized P&amp;L for each trade.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tradePnLData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="trade" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                        <Tooltip formatter={(value) => formatINR(Number(value))} />
                        <Bar dataKey="pnl" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risk" className="mt-6 space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                    <CardHeader>
                      <CardTitle>What the User Should Understand</CardTitle>
                      <CardDescription className="text-slate-400">A plain-language explanation of the strategy for non-quant users.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-6 text-slate-300">
                      <p>
                        The system watches options to see whether they look too expensive or too cheap compared with how much the market has actually been moving.
                      </p>
                      <p>
                        When the difference becomes unusual, it opens a paper trade with virtual money, manages the risk in the backend, and shows the result here.
                      </p>
                      <p>
                        This front end is built to make quantitative trading understandable for regular users without exposing them to raw formulas first.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-white/10 bg-white/5 text-slate-100">
                    <CardHeader>
                      <CardTitle>Suggested Backend Wiring</CardTitle>
                      <CardDescription className="text-slate-400">How this dashboard is wired to your Python backtester.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">POST /simulate → start a paper-trading run with capital, risk, and thresholds</div>
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">summary → performance metrics like Sharpe, drawdown, return, and trade count</div>
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">equity_curve / trades → charts and trade history displayed directly in the dashboard</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {started && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-100"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {loading ? "Simulation running" : result ? "Simulation completed" : "Simulation started"}
                    </div>
                    <div className="text-sm text-emerald-200/80">
                      {result
                        ? `Portfolio analyzed across ${result.summary.num_data_points} data points using ${result.summary.data_source}.`
                        : `Virtual capital ${formatINR(numericCapital || 1000000)} is now being processed by the backend strategy engine.`}
                    </div>
                  </div>
                  <Badge className="rounded-full bg-emerald-300 text-slate-950 hover:bg-emerald-300">
                    {loading ? "Running" : result ? "Ready" : "Queued"}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}