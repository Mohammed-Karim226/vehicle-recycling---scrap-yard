"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence, Variants } from "motion/react";

import { TrendingUp, TrendingDown, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { mockScrapPrices } from "@/lib/mockData";

export default function ScrapPricesView() {
  const [prices, setPrices] = useState(mockScrapPrices);
  const [updating, setUpdating] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [submittedSerial, setSubmittedSerial] = useState(false);

  // Track in-flight timeouts so we can cancel them if the component unmounts
  // or if the user fires a new action before the previous one resolves.
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount: prevents "state update on unmounted component" leaks.
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const triggerLiveUpdate = () => {
    if (updating) return; // extra guard alongside the disabled button

    setUpdating(true);

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    updateTimeoutRef.current = setTimeout(() => {
      // Simulate slight dynamic index oscillations based on actual metal fluctuations
      setPrices((prev) =>
        prev.map((item) => {
          const offset = (Math.random() - 0.5) * 0.15;
          const trendOptions = ["Rising", "Falling", "Stable"] as const;
          return {
            ...item,
            pricePerKgMin: Math.max(0.1, item.pricePerKgMin + offset),
            pricePerKgMax: Math.max(0.15, item.pricePerKgMax + offset),
            trend:
              Math.random() > 0.6
                ? trendOptions[Math.floor(Math.random() * 3)]
                : item.trend,
          };
        })
      );
      setUpdating(false);
      updateTimeoutRef.current = null;
    }, 1200);
  };

  const handleWhatsAppSimulation = (e: FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) return;

    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);

    setSubmittedSerial(true);
    submitTimeoutRef.current = setTimeout(() => {
      setSubmittedSerial(false);
      submitTimeoutRef.current = null;
    }, 8000);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
      id="scrap-prices-tab-view"
    >
      {/* Intro Ticker Banner */}
      <motion.div
        variants={itemVariants}
        className="relative p-[1px] bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="bg-slate-950/70 backdrop-blur-3xl p-6 sm:p-8 rounded-[15px] relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="bg-emerald-950/85 text-emerald-400 font-mono text-[9px] font-bold px-2.5 py-1 rounded-full border border-emerald-900/40 flex items-center space-x-1.5 uppercase">
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                <span>Live Prices Active</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px] uppercase font-semibold">
                LME Spot Index Matched
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              REAL-TIME SCRAP METAL RATES
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Global spot prices dictate daily scrap metal valuations. Drive up to our Peterborough scales on Oxney Road for immediate high-accuracy weigh-ins.
            </p>
          </div>

          <button
            onClick={triggerLiveUpdate}
            disabled={updating}
            aria-busy={updating}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-[10px] text-white uppercase tracking-widest font-mono font-bold px-4 py-3.5 rounded-xl border border-white/5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-red-400 ${updating ? "animate-spin" : ""}`} />
            <span>{updating ? "Syncing index..." : "Refresh Index"}</span>
          </button>
        </div>
      </motion.div>

      {/* Grid containing Scrap rates table & Catalytic converter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Price Table Card - Premium dynamic table */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl p-6 space-y-6"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
            Non-Ferrous Metals Index
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5">Category</th>
                  <th className="py-3.5 text-right">Estimated Price (per kg)</th>
                  <th className="py-3.5 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {prices.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.01] transition-all group">
                    <td className="py-4 font-bold text-white text-xs sm:text-sm uppercase tracking-wide group-hover:text-red-400 transition-colors">
                      {item.category}
                    </td>
                    <td className="py-4 text-right font-mono font-black text-slate-200 text-xs sm:text-sm">
                      £{item.pricePerKgMin.toFixed(2)} - £{item.pricePerKgMax.toFixed(2)}
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center justify-end space-x-1.5">
                        {item.trend === "Rising" && (
                          <span className="bg-emerald-950/50 text-emerald-400 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold flex items-center space-x-1 border border-emerald-900/30">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>RISING</span>
                          </span>
                        )}
                        {item.trend === "Falling" && (
                          <span className="bg-rose-950/50 text-rose-400 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold flex items-center space-x-1 border border-rose-900/30">
                            <TrendingDown className="h-3.5 w-3.5" />
                            <span>FALLING</span>
                          </span>
                        )}
                        {item.trend === "Stable" && (
                          <span className="bg-slate-900/50 text-slate-400 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold flex items-center space-x-1 border border-white/5">
                            <span>STABLE</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Catalytic Converter Valuation Card */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl"
        >
          {/* Subtle gradient light sweep */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
              Catalytic Converter Lookup
            </h3>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Industrial catalytic converter metals (Platinum, Palladium, Rhodium) change in price by the hour. We evaluate using specific manufacturer part codes for precise values.
            </p>

            <div className="p-4 bg-slate-900/50 rounded-xl space-y-1.5 text-center border border-white/5 shadow-inner">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold">Typical Payout Range</span>
              <div className="text-amber-400 font-black text-2xl tracking-tight sm:text-3xl font-mono">
                £40 - £650+
              </div>
            </div>

            {/* Quick Form */}
            <form onSubmit={handleWhatsAppSimulation} className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="catalytic-serial-input"
                  className="block text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold"
                >
                  Enter Serial / Part Code
                </label>
                <input
                  id="catalytic-serial-input"
                  type="text"
                  placeholder="e.g. GM102, 1278393, Ford-B5"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-mono p-3 rounded-lg text-xs uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={!serialNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[10px] uppercase py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 tracking-wider transition-all cursor-pointer border border-white/10 shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>WhatsApp Serial Photo</span>
              </button>
            </form>

            <AnimatePresence>
              {submittedSerial && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="status"
                  className="p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-400 text-[10px] flex items-start space-x-2 font-mono"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Redirecting to WhatsApp to send serial details to a valuer...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500 leading-relaxed font-mono">
            ⚙️ Don&apos;t know where the number is? Rub off rusty residue from the metal box near the exhaust manifold to locate the stamped code.
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}