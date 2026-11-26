"use client";
import { motion } from "motion/react";
import { Car, Hammer, Search, Info, ClipboardList, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import ScrapQuoteDialog from "./ScrapQuoteDialog";
import { Button } from "@/components/ui/button";


interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  requestCount: number;
}

export default function Header({ currentTab, setCurrentTab, requestCount }: HeaderProps) {
  
  const navItems = [
    { id: "home", label: "Home", mobileLabel: "Home", icon: Car },
    { id: "parts", label: "Find Parts", mobileLabel: "Parts", icon: Search },
    { id: "prices", label: "Scrap Prices", mobileLabel: "Prices", icon: Hammer },
    { id: "about", label: "About", mobileLabel: "About", icon: Info },
    { id: "requests", label: "Inquiries", mobileLabel: "Inquiries", icon: ClipboardList, badge: requestCount },
    { id: "admin", label: "Admin", mobileLabel: "Admin", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/45 backdrop-blur-3xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:h-20 sm:px-6 lg:px-8">
        
        <button
          type="button"
          onClick={() => setCurrentTab("home")} 
          aria-label="RRS Autos home"
          className="group flex min-w-0 items-center gap-2 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:gap-3"
          id="header-logo-container"
        >
          <span className="relative shrink-0">
            <span className="absolute inset-0 bg-gradient-to-tr from-red-500 via-pink-600 to-amber-500 rounded-xl blur-md scale-105 opacity-80 group-hover:scale-115 transition-transform duration-300" />
            
            <span className="relative flex size-10 items-center justify-center rounded-xl border border-white/20 bg-slate-950 font-mono font-black text-white shadow-inner sm:h-11 sm:w-12">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-500 to-amber-400 text-lg tracking-wider">RRS</span>
            </span>
          </span>
          
          <span className="min-w-0">
            <span className="flex items-center font-display text-xl font-normal tracking-normal text-white transition-colors group-hover:text-red-400 sm:text-2xl">
              AUTOS
              <span className="text-[10px] text-slate-400 font-mono tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ml-1.5 hidden sm:inline-block">PETERBOROUGH</span>
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-widest text-slate-500 min-[420px]:block">Environment Agency Approved</span>
          </span>
        </button>

        <nav aria-label="Main navigation" className="relative hidden shrink-0 items-center gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-1 xl:flex" id="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                variant="ghost"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setCurrentTab(item.id)}
                className={cn(
                  "relative flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide transition-all",
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
                  <span className="relative z-10 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-1 text-[8px] font-black text-white">
                    {requestCount > 99 ? "99+" : requestCount}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center">
         <ScrapQuoteDialog onQuoteAdded={() => setCurrentTab("requests")}>
            <Button
              id="nav-get-quote-cta"
              className="group relative h-auto min-h-11 rounded-xl bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 p-px transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.5)] active:scale-95"
            >
              <span className="flex min-h-10 items-center gap-2 rounded-[11px] bg-slate-950 px-3 py-2.5 font-mono text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors duration-300 group-hover:bg-transparent sm:px-4 sm:text-xs">
                <span className="group-hover:text-white text-slate-200">
                  Get A Quote
                </span>
                <span className="text-red-400 group-hover:text-white font-serif">
                  →
                </span>
              </span>
            </Button>
          </ScrapQuoteDialog>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="grid grid-cols-6 gap-1 border-t border-white/5 bg-slate-950/60 px-2 py-1.5 backdrop-blur-xl xl:hidden"
        id="mobile-nav"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <Button
              key={item.id}
              id={`nav-mob-${item.id}`}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              onClick={() => setCurrentTab(item.id)}
              className={cn(
                "relative h-12 w-full min-w-0 flex-col gap-1 rounded-lg px-0.5 py-1 transition-colors",
                isActive
                  ? "text-red-400 hover:bg-white/5 hover:text-red-300"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorMobile"
                  transition={{type:"spring"}}
                  className="pointer-events-none absolute inset-0 rounded-lg border border-white/10 bg-white/5"
                />
              )}
              <div className="relative z-10">
                <Icon className="size-[18px]" aria-hidden="true" />
                {item.id === "requests" && requestCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-0.5 font-mono text-[7px] font-black text-white">
                    {requestCount > 99 ? "99+" : requestCount}
                  </span>
                )}
              </div>
              <span className="relative z-10 text-[9px] font-medium leading-none sm:text-[10px]">{item.mobileLabel}</span>
            </Button>
          );
        })}
      </nav>
    </header>
  );
}
