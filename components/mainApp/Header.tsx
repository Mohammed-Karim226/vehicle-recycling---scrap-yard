"use client";
import { motion } from "motion/react";
import { Car, Hammer, Search, Info, ClipboardList, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";


interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenQuoteModal: () => void;
  requestCount: number;
}

export default function Header({ currentTab, setCurrentTab, onOpenQuoteModal, requestCount }: HeaderProps) {
  
  const navItems = [
    { id: "home", label: "Home", icon: Car },
    { id: "parts", label: "Find Parts", icon: Search },
    { id: "prices", label: "Scrap Prices", icon: Hammer },
    { id: "about", label: "About", icon: Info },
    { id: "requests", label: "Inquiries", icon: ClipboardList, badge: requestCount },
    { id: "admin", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/45 backdrop-blur-3xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <div 
          onClick={() => setCurrentTab("home")} 
          className="flex items-center space-x-3 cursor-pointer group"
          id="header-logo-container"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500 via-pink-600 to-amber-500 rounded-xl blur-md scale-105 opacity-80 group-hover:scale-115 transition-transform duration-300"></div>
            
            <div className="relative bg-slate-950 text-white font-mono h-11 w-12 rounded-xl flex items-center justify-center border border-white/20 font-black shadow-inner">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-500 to-amber-400 text-lg tracking-wider">RRS</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-md sm:text-lg font-black tracking-tight text-white group-hover:text-red-400 transition-colors uppercase flex items-center">
              AUTOS
              <span className="text-[10px] text-slate-400 font-mono tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ml-1.5 hidden sm:inline-block">PETERBOROUGH</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Environment Agency Approved</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center bg-white/[0.03] border border-white/5 p-1.5 rounded-xl space-x-1 relative" id="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all relative font-mono cursor-pointer",
                  isActive ? "text-white" : "text-slate-400 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-pink-600/30 border border-red-500/30 rounded-lg shadow-lg shadow-red-500/10 pointer-events-none"
                  />
                )}

                <Icon className={cn("h-4 w-4 relative z-10", isActive ? "text-red-400" : "text-slate-500")} />
                <span className="relative z-10">{item.label}</span>
                
                {item.id === "requests" && requestCount > 0 && (
                  <span className="relative z-10 ml-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-[8px] font-black text-white animate-pulse">
                    {requestCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          <button
            id="nav-get-quote-cta"
            onClick={onOpenQuoteModal}
            className="group relative bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 p-[1px] rounded-xl hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.5)] transition-all active:scale-95 duration-300 cursor-pointer"
          >
            <div className="bg-slate-950 hover:bg-transparent text-white font-extrabold text-xs px-5 py-3 rounded-xl uppercase tracking-wider font-mono transition-colors duration-300 flex items-center space-x-2">
              <span className="group-hover:text-white text-slate-200">Get A Quote</span>
              <span className="text-red-400 group-hover:text-white font-serif">→</span>
            </div>
          </button>
        </div>
      </div>

      <div className="md:hidden flex overflow-x-auto justify-around bg-slate-950/60 border-t border-white/5 py-2 backdrop-blur-xl" id="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-mob-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={cn(
                "flex flex-col items-center space-y-1 relative px-4 py-1.5 rounded-lg transition-all",
                isActive ? "text-red-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  transition={{type:"spring"}}
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-lg pointer-events-none"
                />
              )}
              <div className="relative z-10">
                <Icon className="h-4.5 w-4.5" />
                {item.id === "requests" && requestCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[7px] font-black text-white font-mono">
                    {requestCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono tracking-wider font-medium uppercase relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
