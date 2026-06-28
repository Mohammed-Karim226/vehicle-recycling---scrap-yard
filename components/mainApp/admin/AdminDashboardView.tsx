"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, AlertCircle, X } from "lucide-react";
import type { AdminSubTab } from "@/types/types";

// ── Hooks ──
import { useAdminAuth } from "./useAdminAuth";
import { useAdminData } from "./useAdminData";

// ── Sub-components ──
import AdminLoginGate from "./AdminLoginGate";
import AdminOverviewPanel from "./AdminOverviewPanel";
import AdminScrapPanel from "./AdminScrapPanel";
import AdminPartsPanel from "./AdminPartsPanel";
import AdminYardPanel from "./AdminYardPanel";
import { useState } from "react";

// ────────────────────────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────────────────────────
const TABS: { id: AdminSubTab; label: string; count?: true }[] = [
  { id: "overview", label: "Overview Metrics" },
  { id: "scrap", label: "Scrap & Valuations", count: true },
  { id: "parts", label: "Spare Request Queue", count: true },
  { id: "yard", label: "Manage Yard Vehicles", count: true },
];

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface AdminDashboardViewProps {
  onRefreshTrigger?: () => void;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
export default function AdminDashboardView({ onRefreshTrigger }: AdminDashboardViewProps) {
  const auth = useAdminAuth();
  const data = useAdminData(onRefreshTrigger);
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>("overview");

  // Fetch data when admin authenticates
  useEffect(() => {
    if (auth.isAdmin) {
      data.fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAdmin]);

  const handleTabChange = useCallback((tabId: AdminSubTab) => {
    setActiveSubTab(tabId);
  }, []);

  // Count resolver for tab badges
  const getTabCount = useCallback(
    (tabId: AdminSubTab): number | null => {
      switch (tabId) {
        case "scrap":
          return data.scrapQuotes.length;
        case "parts":
          return data.partRequests.length;
        case "yard":
          return data.vehicles.length;
        default:
          return null;
      }
    },
    [data.scrapQuotes.length, data.partRequests.length, data.vehicles.length]
  );

  // ── Auth Gate ──
  if (!auth.isAdmin) {
    return (
      <AdminLoginGate
        loginError={auth.loginError}
        isLocked={auth.isLocked}
        cooldownRemaining={auth.cooldownRemaining}
        onLogin={auth.handleLogin}
      />
    );
  }

  // ── Authenticated Dashboard ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
      id="admin-active-dashboard"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] text-red-500 font-mono uppercase font-black tracking-widest flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-Time Cloud Connected Database Active
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            CONTROL CENTER PANEL
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-sans">
            Manage customer quotes, live parts requests, and actual breaker yard
            stock in a single compliant dashboard.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="admin-sync-btn"
            onClick={data.fetchAllData}
            disabled={data.loading}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold text-white px-3.5 py-2 rounded-xl border border-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${data.loading ? "animate-spin text-red-400" : ""}`}
            />
            <span>Sync DB</span>
          </button>
          <button
            id="admin-logout-btn"
            onClick={auth.handleLogout}
            className="bg-slate-900 hover:bg-red-950/20 text-slate-400 hover:text-red-400 text-[10px] font-mono font-bold px-3.5 py-2 rounded-xl border border-white/5 transition-all cursor-pointer"
          >
            Lock Terminal
          </button>
        </div>
      </div>

      {/* Error banner */}
      {data.error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-red-950/40 border border-red-900/30 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300 font-mono">{data.error}</span>
          </div>
          <button
            onClick={data.clearError}
            className="text-red-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* Tab navigation */}
      <div className="flex overflow-x-auto bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 whitespace-nowrap scrollbar-none">
        {TABS.map((tab) => {
          const count = tab.count ? getTabCount(tab.id) : null;
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-mono tracking-wide cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                    activeSubTab === tab.id
                      ? "bg-white text-slate-950"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {data.loading ? (
        <div className="p-20 bg-slate-950/45 border border-white/5 rounded-2xl text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-red-500 mx-auto" />
          <p className="text-slate-400 text-xs font-mono">
            Syncing securely with Firestore...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeSubTab === "overview" && (
            <motion.div
              key="overview-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AdminOverviewPanel
                vehicles={data.vehicles}
                scrapQuotes={data.scrapQuotes}
                partRequests={data.partRequests}
              />
            </motion.div>
          )}

          {activeSubTab === "scrap" && (
            <motion.div
              key="scrap-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AdminScrapPanel
                scrapQuotes={data.scrapQuotes}
                actionLoading={data.actionLoading}
                onUpdateStatus={data.handleUpdateScrapStatus}
                onDelete={data.handleDeleteScrapQuote}
              />
            </motion.div>
          )}

          {activeSubTab === "parts" && (
            <motion.div
              key="parts-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AdminPartsPanel
                partRequests={data.partRequests}
                actionLoading={data.actionLoading}
                onUpdateStatus={data.handleUpdatePartStatus}
                onDelete={data.handleDeletePartRequest}
              />
            </motion.div>
          )}

          {activeSubTab === "yard" && (
            <motion.div
              key="yard-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AdminYardPanel
                vehicles={data.vehicles}
                actionLoading={data.actionLoading}
                onUpdateStatus={data.handleUpdateYardStatus}
                onDelete={data.handleDeleteYardVehicle}
                onAdd={data.handleAddYardVehicle}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
