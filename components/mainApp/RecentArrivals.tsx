"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const RecentArrivals = ({setCurrentTab}:{setCurrentTab: (tab: string) => void}) => {
  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1.5 flex flex-col items-start text-left">
          <span className="text-[9px] text-red-450 font-mono font-bold uppercase tracking-widest block bg-white/[0.02] border border-white/5 rounded-full px-2.5 py-0.5">
            Updated: Live
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            RECENT ARRIVALS
          </h2>
        </div>

        <button
          onClick={() => setCurrentTab("parts")}
          className="text-red-400 hover:text-red-350 text-xs font-mono font-bold uppercase flex items-center space-x-1.5 hover:underline cursor-pointer"
        >
          <span>Browse All Spares</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        id="recent-arrivals-container"
      >
        {/* Card 1 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-slate-950/45 backdrop-blur-md border border-white/5 hover:border-red-500/25 rounded-2xl overflow-hidden group transition-all text-left"
        >
          <div className="h-44 bg-slate-900 relative">
            <img
              src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop"
              alt="BMW 3"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <span className="absolute top-3 left-3 bg-red-650 text-white text-[9px] font-mono font-black uppercase py-0.5 px-2.5 rounded-full border border-white/10 shadow-lg">
              New Stock
            </span>
          </div>
          <div className="p-5 space-y-1.5">
            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
              BMW 3 SERIES (E46) 320D
            </span>
            <h4 className="text-white font-black text-sm uppercase">
              Titanium Silver Metallic
            </h4>
            <p className="text-[10px] text-slate-400 font-mono font-medium">
              Arrived: Feb 26, 2026
            </p>
            <button
              onClick={() => setCurrentTab("parts")}
              className="text-[10px] text-red-400 font-mono font-bold tracking-widest uppercase pt-3.5 block hover:text-red-300 text-left cursor-pointer border-t border-white/[0.03] mt-2.5"
            >
              Request parts from this car →
            </button>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-slate-950/45 backdrop-blur-md border border-white/5 hover:border-red-500/25 rounded-2xl overflow-hidden group transition-all text-left"
        >
          <div className="h-44 bg-slate-900 relative">
            <img
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop"
              alt="Ford Focus"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <span className="absolute top-3 left-3 bg-red-650 text-white text-[9px] font-mono font-black uppercase py-0.5 px-2.5 rounded-full border border-white/10 shadow-lg">
              New Stock
            </span>
          </div>
          <div className="p-5 space-y-1.5">
            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
              FORD FOCUS ST-2 2.5T
            </span>
            <h4 className="text-white font-black text-sm uppercase">
              Electric Orange
            </h4>
            <p className="text-[10px] text-slate-400 font-mono font-medium">
              Arrived: Feb 24, 2026
            </p>
            <button
              onClick={() => setCurrentTab("parts")}
              className="text-[10px] text-red-400 font-mono font-bold tracking-widest uppercase pt-3.5 block hover:text-red-300 text-left cursor-pointer border-t border-white/[0.03] mt-2.5"
            >
              Request parts from this car →
            </button>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-slate-950/45 backdrop-blur-md border border-white/5 hover:border-red-500/25 rounded-2xl overflow-hidden group transition-all text-left"
        >
          <div className="h-44 bg-slate-900 relative">
            <img
              src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=600&auto=format&fit=crop"
              alt="VW Golf"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <span className="absolute top-3 left-3 bg-red-650 text-white text-[9px] font-mono font-black uppercase py-0.5 px-2.5 rounded-full border border-white/10 shadow-lg">
              New Stock
            </span>
          </div>
          <div className="p-5 space-y-1.5">
            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
              VW GOLF MK5 GT-TDI
            </span>
            <h4 className="text-white font-black text-sm uppercase">
              Shadow Blue Metallic
            </h4>
            <p className="text-[10px] text-slate-400 font-mono font-medium">
              Arrived: Feb 24, 2026
            </p>
            <button
              onClick={() => setCurrentTab("parts")}
              className="text-[10px] text-red-400 font-mono font-bold tracking-widest uppercase pt-3.5 block hover:text-red-300 text-left cursor-pointer border-t border-white/[0.03] mt-2.5"
            >
              Request parts from this car →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RecentArrivals;
