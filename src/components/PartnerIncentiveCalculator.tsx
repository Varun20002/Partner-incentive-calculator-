import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Users,
  Percent,
  Trophy,
  Target,
  TrendingUp,
  Calculator,
  IndianRupee,
  ChartCandlestick,
  Blocks,
  UserPlus,
} from 'lucide-react';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const USD_RATE = 90;
const FEE_PERCENT = 0.0004; // 0.04%
const ACQUISITION_BOUNTY = 500;

const SLABS = [
  { threshold: 1000000, payout: 10000 },
  { threshold: 2500000, payout: 25000 },
  { threshold: 5000000, payout: 50000 },
  { threshold: 7500000, payout: 75000 },
  { threshold: 10000000, payout: 100000 },
  { threshold: 20000000, payout: 200000 },
  { threshold: 30000000, payout: 300000 },
  { threshold: 40000000, payout: 400000 },
  { threshold: 50000000, payout: 500000 },
  { threshold: 60000000, payout: 600000 },
  { threshold: 70000000, payout: 700000 },
  { threshold: 80000000, payout: 800000 },
  { threshold: 90000000, payout: 900000 },
  { threshold: 100000000, payout: 1000000 },
];

type Mode = 'gross' | 'net';
type GrossBrokeragePct = 20 | 25 | 30 | 35 | 40;
const BROKERAGE_OPTIONS: GrossBrokeragePct[] = [20, 25, 30, 35, 40];

// --- Animated Number ---
function AnimatedNumber({ value, currency = true }: { value: number; currency?: boolean }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    currency
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(Math.round(current))
      : Math.round(current).toString()
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function PartnerIncentiveCalculator() {
  // --- State ---
  const [mode, setMode] = useState<Mode>('gross');
  const [grossBrokeragePct, setGrossBrokeragePct] = useState<GrossBrokeragePct>(40);

  const [newUsers, setNewUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(2000);
  const [avgMargin, setAvgMargin] = useState(100000);
  const [leverage, setLeverage] = useState(5);
  const [tradesPerUser, setTradesPerUser] = useState(60);

  const netBrokeragePct = grossBrokeragePct * 2;
  const effectiveSharePct = mode === 'gross' ? grossBrokeragePct : netBrokeragePct;

  // --- Calculations ---
  const volPerUser = useMemo(
    () => avgMargin * leverage * tradesPerUser,
    [avgMargin, leverage, tradesPerUser]
  );

  const totalVolINR = useMemo(() => {
    const count = Number(newUsers) + Number(activeUsers);
    return count * volPerUser;
  }, [newUsers, activeUsers, volPerUser]);

  const totalVolUSD = useMemo(() => totalVolINR / USD_RATE, [totalVolINR]);

  const acquisitionIncome = useMemo(() => {
    if (volPerUser >= 1000000) return Math.max(0, newUsers * ACQUISITION_BOUNTY);
    return 0;
  }, [newUsers, volPerUser]);

  const totalFees = useMemo(() => totalVolINR * FEE_PERCENT, [totalVolINR]);
  const liquidityCost = useMemo(
    () => (mode === 'gross' ? totalFees * 0.5 : 0),
    [totalFees, mode]
  );
  const netRevenue = useMemo(() => totalFees * 0.5, [totalFees]);

  const partnerShare = useMemo(() => {
    if (mode === 'gross') return totalFees * (grossBrokeragePct / 100);
    return netRevenue * (netBrokeragePct / 100);
  }, [mode, totalFees, netRevenue, grossBrokeragePct, netBrokeragePct]);

  const companyShare = useMemo(() => {
    if (mode === 'gross') return totalFees * ((50 - grossBrokeragePct) / 100);
    return netRevenue - partnerShare;
  }, [mode, totalFees, grossBrokeragePct, netRevenue, partnerShare]);

  const commissionIncome = partnerShare;

  const companyPct = mode === 'gross' ? 50 - grossBrokeragePct : 100 - netBrokeragePct;
  const brokeragePct = effectiveSharePct;
  const liquidityPct = mode === 'gross' ? 50 : 0;

  const calculateSlabIncome = (volumeUSD: number) => {
    for (let i = SLABS.length - 1; i >= 0; i--) {
      if (volumeUSD >= SLABS[i].threshold) {
        return { index: i, income: SLABS[i].payout };
      }
    }
    return { index: -1, income: 0 };
  };

  const { index: slabIndex, income: slabIncome } = useMemo(
    () => calculateSlabIncome(totalVolUSD),
    [totalVolUSD]
  );

  const netTotal = useMemo(
    () => acquisitionIncome + slabIncome + commissionIncome,
    [acquisitionIncome, slabIncome, commissionIncome]
  );

  // --- Confetti ---
  const prevSlabIndexRef = useRef(slabIndex);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSlabIndexRef.current = slabIndex;
      return;
    }
    if (slabIndex > prevSlabIndexRef.current) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#eab308', '#3b82f6'],
      });
    }
    prevSlabIndexRef.current = slabIndex;
  }, [slabIndex]);

  // --- Render ---
  return (
    <div className="w-full max-w-7xl mx-auto overflow-x-hidden px-3 py-2 sm:px-4 sm:py-3 md:p-4 font-sans">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="shrink-0 rounded-lg border border-white/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-sm">
              <Calculator className="h-5 w-5 text-gray-900 sm:h-5 sm:w-5" />
            </div>
            <h1 className="min-w-0 text-balance text-lg font-bold tracking-tight text-gray-900 sm:text-xl md:text-2xl">
              Partner Earnings Calculator
            </h1>
          </div>
          <p className="text-pretty text-sm text-gray-500 sm:text-sm">
            Simulate your monthly earnings based on users and volume.
          </p>
        </div>

        {/* Gross / Net Toggle — full-width on narrow phones for 44px+ touch targets */}
        <div className="flex w-full shrink-0 sm:w-auto sm:justify-end">
          <div className="inline-flex w-full rounded-full border border-gray-200 bg-gray-100 p-1 shadow-sm sm:w-auto">
            {(['gross', 'net'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition-all sm:min-h-0 sm:flex-none sm:px-5 sm:py-2',
                  mode === m
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-500 active:bg-gray-200/80 sm:hover:text-gray-700'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch lg:gap-5">
        {/* Left Column: Inputs */}
        <div className="flex min-h-0 lg:col-span-5">
          <div className="flex-1 space-y-4 rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-5">
            {/* Users */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  New Users
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={newUsers}
                  onChange={(e) => {
                    const val = Math.min(200, Math.max(0, Number(e.target.value)));
                    setNewUsers(val);
                  }}
                  className="min-h-11 w-24 rounded-lg border border-blue-100 bg-blue-50 px-2 py-2 text-center text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex justify-between items-center">
                <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  Active Users
                </label>
                <input
                  type="number"
                  min="0"
                  value={activeUsers}
                  onChange={(e) => setActiveUsers(Number(e.target.value))}
                  className="min-h-11 w-24 rounded-lg border border-blue-100 bg-blue-50 px-2 py-2 text-center text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Volume Configuration */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Volume Calculation
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Avg Margin / User">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('en-IN').format(avgMargin)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setAvgMargin(Math.max(0, raw === '' ? 0 : Number(raw)));
                    }}
                    className={inputCls('pl-7')}
                  />
                </Field>

                <Field label="Leverage">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={leverage === 0 ? '' : leverage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') return setLeverage(0);
                      setLeverage(Number(val));
                    }}
                    onBlur={() => {
                      let finalVal = Math.max(1, Math.min(100, leverage));
                      if (leverage === 0) finalVal = 1;
                      setLeverage(finalVal);
                    }}
                    className={inputCls()}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Trades / Month / User">
                    <input
                      type="text"
                      value={tradesPerUser}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setTradesPerUser(Math.max(0, raw === '' ? 0 : Number(raw)));
                      }}
                      className={inputCls()}
                    />
                  </Field>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex justify-between items-center text-sm">
                <span className="text-emerald-700 font-medium">Volume / User</span>
                <span className="text-emerald-800 font-bold">
                  <AnimatedNumber value={volPerUser} />
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Revenue Share */}
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                <Percent className="w-4 h-4 text-purple-500" />
                Revenue Share
              </label>
              <select
                value={grossBrokeragePct}
                onChange={(e) =>
                  setGrossBrokeragePct(Number(e.target.value) as GrossBrokeragePct)
                }
                className={inputCls()}
              >
                {BROKERAGE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {mode === 'gross' ? `${p}%` : `${p * 2}%`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                {mode === 'gross'
                  ? `${grossBrokeragePct}% of Gross Fees`
                  : `${grossBrokeragePct * 2}% of Net Revenue`}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-gray-100 pt-3 text-sm">
              <span className="shrink-0 text-gray-500">Total Volume (INR)</span>
              <span className="min-w-0 text-right font-semibold text-gray-800">
                <AnimatedNumber value={totalVolINR} />
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Results — hero grows on lg so row aligns with left panel */}
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7 lg:h-full">
          {/* Hero: Net Monthly Earnings */}
          <motion.div
            layout
            className="relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-8 text-white shadow-xl sm:min-h-[200px] sm:px-6 sm:py-10 md:p-8 lg:min-h-[240px] lg:flex-1"
          >
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl"></div>

            <div className="relative z-10 mx-auto max-w-[min(100%,22rem)] space-y-2 text-center sm:max-w-none">
              <h3 className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 sm:text-[11px]">
                <Trophy className="h-3 w-3 shrink-0" />
                Net Monthly Earnings
              </h3>
              <div className="text-3xl font-bold leading-none tracking-tight drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
                <AnimatedNumber value={netTotal} />
              </div>
              <p className="text-pretty px-1 text-xs leading-relaxed text-gray-400 sm:px-0 sm:text-sm">
                {mode === 'gross' ? 'Gross model' : 'Net revenue sharing model'} · Total estimated
                payout
              </p>
            </div>
          </motion.div>

          {/* Platform Fee Distribution */}
          <FeeDistribution
            mode={mode}
            totalFees={totalFees}
            liquidityPct={liquidityPct}
            companyPct={companyPct}
            brokeragePct={brokeragePct}
          />

          {/* Breakdown - single row on desktop */}
          <div
            className={cn(
              'grid auto-rows-fr gap-2.5 sm:gap-3',
              mode === 'gross'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                : 'grid-cols-2 lg:grid-cols-4'
            )}
          >
            {mode === 'gross' && (
              <MiniCard
                title="Liquidity Cost"
                badge="50%"
                value={liquidityCost}
                icon={<ChartCandlestick className="w-3.5 h-3.5" />}
                color="blue"
              />
            )}
            <MiniCard
              title="Company"
              badge={`${companyPct}%`}
              value={companyShare}
              icon={<Blocks className="w-3.5 h-3.5" />}
              color="purple"
            />
            <MiniCard
              title="Brokerage"
              badge={`${brokeragePct}%`}
              value={partnerShare}
              icon={<IndianRupee className="w-3.5 h-3.5" />}
              color="orange"
            />
            <MiniCard
              title="New Users"
              value={acquisitionIncome}
              icon={<UserPlus className="w-3.5 h-3.5" />}
              color="blue"
            />
            <MiniCard
              title="Volume Incentive"
              value={slabIncome}
              icon={<Target className="w-3.5 h-3.5" />}
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers & subcomponents ---

function inputCls(extra = '') {
  return cn(
    'min-h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-base font-medium text-gray-900 sm:text-sm',
    'touch-manipulation outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
    extra
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

interface FeeDistributionProps {
  mode: Mode;
  totalFees: number;
  liquidityPct: number;
  companyPct: number;
  brokeragePct: number;
}

function FeeDistribution({
  mode,
  totalFees,
  liquidityPct,
  companyPct,
  brokeragePct,
}: FeeDistributionProps) {
  // Bar fills align with MiniCard accent colors (blue / purple / orange).
  const segments = [
    mode === 'gross'
      ? {
          key: 'liquidity',
          label: 'Liquidity Cost',
          pct: liquidityPct,
          bar: 'bg-blue-500',
        }
      : null,
    {
      key: 'company',
      label: 'Company',
      pct: companyPct,
      bar: 'bg-purple-500',
    },
    {
      key: 'brokerage',
      label: 'Brokerage',
      pct: brokeragePct,
      bar: 'bg-orange-500',
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    pct: number;
    bar: string;
  }>;

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800">Platform Fee Distribution</h3>
          <p className="mt-0.5 text-pretty text-[11px] leading-snug text-gray-500">
            {mode === 'gross'
              ? 'Gross model — exchange cost included'
              : 'Net revenue model — after exchange cost'}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline justify-between gap-3 border-t border-gray-100 pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500 sm:text-right">
            Total Fees
          </div>
          <div className="text-right text-base font-bold tabular-nums text-gray-900 sm:text-sm">
            <AnimatedNumber value={totalFees} />
          </div>
        </div>
      </div>

      {/* Segmented bar with internal % labels */}
      <div className="flex h-8 w-full overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200/60 sm:h-7">
        {segments.map((s) => (
          <div
            key={s.key}
            className={cn(
              'flex h-full min-w-0 items-center justify-center overflow-hidden text-[9px] font-bold text-white/95 transition-all duration-500 sm:text-[10px]',
              s.bar
            )}
            style={{ width: `${s.pct}%` }}
            title={`${s.label} ${s.pct}%`}
          >
            {s.pct >= 10 ? `${s.pct}%` : ''}
          </div>
        ))}
      </div>

    </div>
  );
}

interface MiniCardProps {
  title: string;
  badge?: string;
  value: number;
  color: 'blue' | 'purple' | 'orange';
  icon: React.ReactNode;
}

function MiniCard({ title, badge, value, color, icon }: MiniCardProps) {
  const iconStyles = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-gray-200/70 bg-white p-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:p-3.5"
    >
      <div className="flex items-center justify-between">
        <div className={cn('p-1.5 rounded-md', iconStyles[color])}>{icon}</div>
        {badge && (
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="break-words text-[11px] font-medium uppercase tracking-wider text-gray-500">
        {title}
      </div>
      <div className="break-words text-base font-bold tabular-nums text-gray-900 sm:text-lg">
        <AnimatedNumber value={value} />
      </div>
    </motion.div>
  );
}
