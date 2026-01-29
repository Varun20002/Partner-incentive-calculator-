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
  IndianRupee 
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
  // Volume Inputs
  const [avgMargin, setAvgMargin] = useState(1000);
  const [leverage, setLeverage] = useState(25);
  const [tradesPerUser, setTradesPerUser] = useState(10);
  
  const sharePercent = 20; // Fixed at 20%

  // --- Optimized Calculations ---

  // 0. Volume per User (Derived)
  const volPerUser = useMemo(() => {
    return avgMargin * leverage * tradesPerUser;
  }, [avgMargin, leverage, tradesPerUser]);
  
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 font-sans">
      
      {/* Header */}
      <div className="mb-6 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
            <Calculator className="w-6 h-6 text-gray-900" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Partner Calculator</h1>
        </div>
        <p className="text-gray-600 text-base max-w-2xl">
          Simulate your potential earnings based on user acquisition and volume.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-5 md:p-6 space-y-6 border border-white/50">
            {/* Removed Configuration Header */}
            
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
                    max="200"
                    value={newUsers}
                    onChange={(e) => {
                      const val = Math.min(200, Math.max(0, Number(e.target.value)));
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
                  max="200"
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
                  <span>100</span>
                  <span>200</span>
                </div>
              </div>
            </div>

            {/* Volume Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Volume Calculation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Average Margin per User */}
                <div className="space-y-2">
                   <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">AVG Margin/User</label>
                   <div className="relative group">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                     <input
                       type="text"
                       value={new Intl.NumberFormat('en-IN').format(avgMargin)}
                       onChange={(e) => {
                         const rawValue = e.target.value.replace(/[^0-9]/g, '');
                         const val = rawValue === '' ? 0 : Number(rawValue);
                         setAvgMargin(Math.max(0, val));
                       }}
                       className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium"
                     />
                   </div>
                </div>

                {/* Leverage */}
                <div className="space-y-2">
                   <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Leverage</label>
                   <div className="relative group">
                     <input
                       type="number"
                       min="1"
                       max="100"
                       value={leverage === 0 ? '' : leverage}
                       onChange={(e) => {
                         const val = e.target.value;
                         if (val === '') {
                           setLeverage(0);
                           return;
                         }
                         const numVal = Number(val);
                         setLeverage(numVal);
                       }}
                       onBlur={() => {
                         let finalVal = Math.max(1, Math.min(100, leverage));
                         if (leverage === 0) finalVal = 1;
                         setLeverage(finalVal);
                       }}
                       className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium"
                     />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">x</span>
                   </div>
                </div>

                {/* Monthly Trades per User */}
                <div className="space-y-2 md:col-span-2">
                   <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trades / Month / User</label>
                   <input
                     type="text"
                     value={tradesPerUser}
                     onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        const val = rawValue === '' ? 0 : Number(rawValue);
                        setTradesPerUser(Math.max(0, val));
                     }}
                     className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium"
                   />
                </div>
              </div>

              {/* Calculated Volume per User Display */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="text-emerald-700 font-medium">Calculated Volume / User</span>
                <span className="text-emerald-800 font-bold">
                  <AnimatedNumber value={volPerUser} />
                </span>
              </div>
            </div>

            {/* Revenue Share Tabs */}
            <div className="space-y-4">
              <label className="font-semibold text-gray-700 flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-500" />
                Revenue Share
              </label>
              <div className="flex bg-gray-100/80 p-1.5 rounded-2xl relative">
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative z-10 text-blue-600 bg-white shadow-sm border border-gray-200/50"
                >
                  <span className="relative z-10">20%</span>
                </button>
              </div>
            </div>

            {/* Info Summary */}
            <div className="pt-6 border-t border-gray-100">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Volume (INR)</span>
                  <span className="font-medium text-gray-700">
                    <AnimatedNumber value={totalVolINR} />
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col h-full">
          
          {/* Net Total Card */}
          <motion.div 
            layout
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 lg:p-10 text-white relative overflow-hidden group border border-white/10 flex-grow flex flex-col justify-center min-h-[300px]"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-blue-500/30 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-emerald-300 font-semibold tracking-wider uppercase text-xs flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Trophy className="w-3 h-3" />
                Net Monthly Earnings
              </h3>
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold font-tight tracking-tight drop-shadow-lg">
                <AnimatedNumber value={netTotal} />
              </div>
              <p className="text-gray-400 text-sm md:text-base">Total estimated payout based on current performance</p>
            </div>
          </motion.div>

          {/* Breakdown Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card 
              title="New Users" 
              value={acquisitionIncome} 
              icon={<Users className="w-4 h-4" />}
              color="blue"
              delay={0.1}
            />
            <Card 
              title="Volume Incentives" 
              value={slabIncome} 
              icon={<Target className="w-4 h-4" />}
              color="purple"
              delay={0.2}
            />
            <Card 
              title="Brokerage" 
              value={commissionIncome} 
              icon={<IndianRupee className="w-4 h-4" />}
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
