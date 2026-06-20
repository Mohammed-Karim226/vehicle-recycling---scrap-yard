"use client";

import { motion } from "motion/react";
import { CreditCard, Hammer, Truck } from "lucide-react";
const UspCoreValues = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4" id="value-props-grid">
             <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-lg"
                >
                  <div className="h-12 w-12 bg-red-950/40 border border-red-900/35 rounded-xl flex items-center justify-center text-red-400 shadow-inner">
                    <Hammer className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-white font-mono font-bold tracking-widest text-xs uppercase">BEST PRICES PAID</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    We monitor scrap metal rates daily on the London Metal Exchange to ensure you receive perfect, optimal valuations.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-lg"
                >
                  <div className="h-12 w-12 bg-red-950/40 border border-red-900/35 rounded-xl flex items-center justify-center text-red-400 shadow-inner">
                    <Truck className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-white font-mono font-bold tracking-widest text-xs uppercase">FREE COLLECTION</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Specialist recovery towing fleet stationed near Oxney Road operating fast collections from Stamford, March, Wisbech, and beyond.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-lg"
                >
                  <div className="h-12 w-12 bg-red-950/40 border border-red-900/35 rounded-xl flex items-center justify-center text-red-400 shadow-inner">
                    <CreditCard className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-white font-mono font-bold tracking-widest text-xs uppercase">SAME DAY PAYMENT</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Direct instant bank transfer made securely upon scale weigh-in or vehicle driveway hand-over. Zero fees, zero delay.
                  </p>
                </motion.div>
    </div>
  )
}

export default UspCoreValues