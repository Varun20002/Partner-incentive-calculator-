import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Users, 
  DollarSign, 
  Percent, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calculator 
} from 'lucide-react';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const USD_RATE = 90;
const FEE_PERCENT = 0.0005; // 0.05%
const ACQUISITION_BOUNTY = 500;

// --- Constants & Slabs ---
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

// --- Animated Number Component ---
function AnimatedNumber({ value, currency = true }: { value: number, currency?: boolean }) {
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
  const [newUsers, setNewUsers] = useState(100);
  const [volPerUser, setVolPerUser] = useState(1000000);
  const [sharePercent, setSharePercent] = useState<20 | 25 | 30>(30);

  // --- Optimized Calculations ---
  
  // 1. Total Volume INR
  const totalVolINR = useMemo(() => {
    return Math.max(0, newUsers * volPerUser);
  }, [newUsers, volPerUser]);

  // 2. Total Volume USD
  const totalVolUSD = useMemo(() => {
    return totalVolINR / USD_RATE;
  }, [totalVolINR]);

  // 3. Acquisition Income
  const acquisitionIncome = useMemo(() => {
    return Math.max(0, newUsers * ACQUISITION_BOUNTY);
  }, [newUsers]);

  // 4. Commission Income
  const commissionIncome = useMemo(() => {
    return totalVolINR * FEE_PERCENT * (sharePercent / 100);
  }, [totalVolINR, sharePercent]);

  // 5. Slab Income Helper
  const calculateSlabIncome = (volumeUSD: number) => {
    // Edge case: Volume less than 1M pays 0
    // Backwards iteration logic as per spec
    for (let i = SLABS.length - 1; i >= 0; i--) {
      if (volumeUSD >= SLABS[i].threshold) {
        return { index: i, income: SLABS[i].payout };
      }
    }
    return { index: -1, income: 0 };
  };

  const { index: slabIndex, income: slabIncome } = useMemo(() => {
    return calculateSlabIncome(totalVolUSD);
  }, [totalVolUSD]);

  // 6. Net Total
  const netTotal = useMemo(() => {
    return acquisitionIncome + slabIncome + commissionIncome;
  }, [acquisitionIncome, slabIncome, commissionIncome]);

  // --- Confetti Logic ---
  const prevSlabIndexRef = useRef(slabIndex);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSlabIndexRef.current = slabIndex;
      return;
    }
    
    // Only trigger if we moved UP a tier
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

  // --- Next Goal Logic (Optimized) ---
  const nextGoalData = useMemo(() => {
    // Logic removed as per user request to remove the card
    return null;
  }, [slabIndex, totalVolUSD]);

  const renderNextGoal = () => {
    return null; // Logic removed
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
            <Calculator className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Partner Calculator</h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl">
          Simulate your potential earnings based on user acquisition and volume.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-6 md:p-8 space-y-8 border border-white/50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              Configuration
            </h2>
            
            {/* New Users Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  New Users
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={newUsers}
                    onChange={(e) => {
                      const val = Math.min(500, Math.max(0, Number(e.target.value)));
                      setNewUsers(val);
                    }}
                    className="w-16 text-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm font-bold border border-blue-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
                  />
                </div>
              </div>
              
              <div className="relative pt-2">
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="1"
                  value={newUsers}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) setNewUsers(val);
                  }}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                  <span>0</span>
                  <span>250</span>
                  <span>500</span>
                </div>
              </div>
            </div>

            {/* Volume per User Input */}
            <div className="space-y-4">
              <label className="font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Volume per User (INR)
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium group-focus-within:text-blue-500 transition-colors">₹</span>
                <input
                  type="number"
                  min="0"
                  value={volPerUser}
                  onChange={(e) => {
                    // Handle empty input or invalid numbers gracefully
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setVolPerUser(Math.max(0, val));
                  }}
                  className="w-full pl-9 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Revenue Share Tabs */}
            <div className="space-y-4">
              <label className="font-semibold text-gray-700 flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-500" />
                Revenue Share
              </label>
              <div className="flex bg-gray-100/80 p-1.5 rounded-2xl relative">
                {[20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSharePercent(pct as 20 | 25 | 30)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative z-10",
                      sharePercent === pct
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {sharePercent === pct && (
                      <motion.div
                        layoutId="tab-highlight"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{pct}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Summary */}
            <div className="pt-6 border-t border-gray-100">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Volume (INR)</span>
                  <span className="font-mono font-medium text-gray-700">
                    <AnimatedNumber value={totalVolINR} />
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Net Total Card */}
          <motion.div 
            layout
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 text-white relative overflow-hidden group border border-white/10 min-h-[320px] flex flex-col justify-center"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-blue-500/30 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6">
              <h3 className="text-emerald-300 font-semibold tracking-wider uppercase text-sm flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                <Trophy className="w-4 h-4" />
                Net Monthly Earnings
              </h3>
              <div className="text-5xl md:text-7xl lg:text-8xl font-bold font-tight tracking-tight drop-shadow-lg">
                <AnimatedNumber value={netTotal} />
              </div>
              <p className="text-gray-400 text-base md:text-lg">Total estimated payout based on current performance</p>
            </div>
          </motion.div>

          {/* Breakdown Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              title="Acquisition" 
              value={acquisitionIncome} 
              icon={<Users className="w-4 h-4" />}
              color="blue"
              delay={0.1}
            />
            <Card 
              title="Slab Incentive" 
              value={slabIncome} 
              icon={<Target className="w-4 h-4" />}
              color="purple"
              delay={0.2}
            />
            <Card 
              title="Commission" 
              value={commissionIncome} 
              icon={<DollarSign className="w-4 h-4" />}
              color="orange"
              delay={0.3}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  value: number;
  color: 'blue' | 'purple' | 'orange';
  icon: React.ReactNode;
  delay?: number;
}

function Card({ title, value, color, icon, delay = 0 }: CardProps) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-900 border-blue-100",
    purple: "bg-purple-50 text-purple-900 border-purple-100",
    orange: "bg-orange-50 text-orange-900 border-orange-100",
  };
  
  const iconStyles = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300", 
        "bg-white border-gray-100" // Override colored background for cleaner look, use color for accents
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg", iconStyles[color])}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-600">{title}</span>
      </div>
      
      <div className="text-2xl font-bold text-gray-900">
        <AnimatedNumber value={value} />
      </div>
      
      <div className={cn("h-1 w-full mt-4 rounded-full opacity-20", 
        color === 'blue' ? 'bg-blue-500' : 
        color === 'purple' ? 'bg-purple-500' : 
        'bg-orange-500'
      )} />
    </motion.div>
  );
}
