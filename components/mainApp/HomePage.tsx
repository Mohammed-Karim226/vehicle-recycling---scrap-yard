"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import Header from "./Header";
import Footer from "./Footer";
import { AnimatePresence, motion } from "motion/react";
import ScrapQuoteSection from "./ScrapQuoteSection";
import UspCoreValues from "./UspCoreValues";
import RecentArrivals from "./RecentArrivals";
import { getSubmissionCounts } from "@/lib/actions";

const TabLoading = () => (
  <div className="flex min-h-80 items-center justify-center" role="status">
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
    <span className="sr-only">Loading view</span>
  </div>
);

const FindPartsView = dynamic(() => import("./FindPartsView"), { loading: TabLoading });
const ScrapPricesView = dynamic(() => import("./ScrapPricesView"), { loading: TabLoading });
const AboutContactView = dynamic(() => import("./AboutContactView"), { loading: TabLoading });
const MyRequestsView = dynamic(() => import("./MyRequestsView"), { loading: TabLoading });
const AdminDashboardView = dynamic(() => import("./admin/AdminDashboardView"), {
  loading: TabLoading,
});

const HomePage = () => {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [requestCount, setRequestCount] = useState(0);
  const isFirstRenderRef = useRef(true);

  // Sync request count from DB
  const updateRequestCount = async () => {
    try {
      const counts = await getSubmissionCounts();
      setRequestCount(counts.total);
    } catch (e) {
      console.warn("Could not sync requests count", e);
    }
  };

  useEffect(() => {
    if (isFirstRenderRef.current) {
      updateRequestCount();
      isFirstRenderRef.current = false;
    }
  }, []);
  const handleQuoteAdded = () => {
    updateRequestCount();
  };
  return (
    <section className="flex min-h-dvh w-full min-w-0 flex-col">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        requestCount={requestCount}
      />
      {/* Main content area */}
      <main className="relative z-10 mx-auto w-full min-w-0 max-w-7xl grow px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        <AnimatePresence mode="wait">
          {currentTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
              className="min-w-0 space-y-10 sm:space-y-16"
            >
              {/* Hero Header Presentation with organic fluid lighting overlay */}
              <div className="relative mx-auto w-full min-w-0 max-w-4xl space-y-5 pb-2 pt-2 text-center sm:space-y-6 sm:pt-4">
                {/* Embedded crimson fluid glow orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 bg-gradient-to-tr from-red-600/10 via-pink-600/5 to-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 font-mono text-[8px] font-black uppercase leading-relaxed tracking-wide text-red-400 shadow-inner sm:text-[9px] sm:tracking-widest">
                    <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500"></span>
                    <span>Peterborough&apos;s Premium Vehicle Breaker</span>
                  </span>

                  <h1 className="break-words font-display text-[clamp(1.875rem,7vw,3rem)] font-normal leading-[1.12] tracking-normal text-white sm:text-5xl lg:text-6xl">
                    Peterborough&apos;s Premier <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-amber-500">
                      Vehicle Breakers
                    </span>{" "}
                    Yard
                  </h1>

                  <p className="mx-auto max-w-2xl font-sans text-sm leading-relaxed text-slate-400">
                    We buy any car for scrap or salvage. Get instant high-index
                    quotes, same-day payout transfers, and free hydraulic
                    collection across Peterborough and Cambridgeshire.
                  </p>
                </div>

                {/* Main Quote Widget integrated in-view */}
                <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl pt-2 sm:pt-4">
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
          {/* Admin Dashboard View */}
          {currentTab === "admin" && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboardView onRefreshTrigger={handleQuoteAdded} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer setCurrentTab={setCurrentTab} />
    </section>
  );
};

export default HomePage;
