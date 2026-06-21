"use client";
import { useState } from "react";

import Header from "./Header";
import Footer from "./Footer";
import { AnimatePresence, motion } from "motion/react";
import ScrapQuoteSection from "./ScrapQuoteSection";
import UspCoreValues from "./UspCoreValues";
import RecentArrivals from "./RecentArrivals";
import FindPartsView from "./FindPartsView";
import ScrapPricesView from "./ScrapPricesView";
import AboutContactView from "./AboutContactView";
import MyRequestsView from "./MyRequestsView";

const HomePage = () => {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const handleOpenQuoteModal = () => {
    setQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setQuoteModalOpen(false);
  };
  // Sync request count from full-stack DB
  const updateRequestCount = async () => {
    try {
      // Fetch the count of part quotes and scrap quotations from the backend API
      const res = await fetch("/api/my-submissions");
      if (res.ok) {
        const data = await res.json();
        const total =
          (data.partQuotes?.length || 0) + (data.scrapQuotetions?.length || 0);
        setRequestCount(total);
      }
    } catch (e) {
      console.warn("Could not sync requests count", e);
    }
  };
  const handleQuoteAdded = () => {
    updateRequestCount();
  };
  return (
    <section className="flex flex-col justify-center items-center">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuoteModal={handleOpenQuoteModal}
        requestCount={requestCount}
      />
      {/* Main content area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <AnimatePresence mode="wait">
          {currentTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
              className="space-y-16"
            >
              {/* Hero Header Presentation with organic fluid lighting overlay */}
              <div className="text-center max-w-4xl mx-auto space-y-6 pt-4 pb-2 relative">
                {/* Embedded crimson fluid glow orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 bg-gradient-to-tr from-red-600/10 via-pink-600/5 to-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white/[0.03] text-red-400 font-mono text-[9px] font-black uppercase tracking-widest rounded-full border border-white/5 shadow-inner">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping mr-1"></span>
                    <span>Peterborough&apos;s Premium Vehicle Breaker</span>
                  </span>

                  <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black tracking-tight text-white uppercase leading-[1.05] font-sans">
                    PETERBOROUGH&apos;S PREMIER <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-amber-500">
                      VEHICLE BREAKERS
                    </span>{" "}
                    YARD
                  </h1>

                  <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-sans">
                    We buy any car for scrap or salvage. Get instant high-index
                    quotes, same-day payout transfers, and free hydraulic
                    collection across Peterborough and Cambridgeshire.
                  </p>
                </div>

                {/* Main Quote Widget integrated in-view */}
                <div className="max-w-3xl mx-auto pt-4 relative z-10">
                  <ScrapQuoteSection onQuoteAdded={handleQuoteAdded} />
                </div>
              </div>
              <UspCoreValues />
              <RecentArrivals setCurrentTab={setCurrentTab} />
            </motion.div>
          )}
          {currentTab === "parts" && (
            <motion.div
              key="parts-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <FindPartsView onQuoteAdded={handleQuoteAdded} />
            </motion.div>
          )}
          {currentTab === "prices" && (
            <motion.div
              key="prices-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <ScrapPricesView />
            </motion.div>
          )}
           {/* About View */}
          {currentTab === "about" && (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <AboutContactView />
            </motion.div>
          )}
           {/* Requests View */}
          {currentTab === "requests" && (
            <motion.div
              key="requests-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <MyRequestsView />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      <Footer setCurrentTab={setCurrentTab} />
    </section>
  );
};

export default HomePage;
