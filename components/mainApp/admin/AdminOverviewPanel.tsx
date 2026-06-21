"use client";

import React, { memo } from "react";
import {
  Car,
  TrendingUp,
  FileText,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { VehicleYard, ScrapValuationResult, PartQuoteSubmitted } from "@/types/types";

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface AdminOverviewPanelProps {
  vehicles: VehicleYard[];
  scrapQuotes: ScrapValuationResult[];
  partRequests: PartQuoteSubmitted[];
}

// ────────────────────────────────────────────────────────────
// Metric card data shape
// ────────────────────────────────────────────────────────────
interface MetricItem {
  title: string;
  value: string | number;
  desc: string;
  icon: React.ElementType;
  tint: string;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
function AdminOverviewPanelInner({
  vehicles,
  scrapQuotes,
  partRequests,
}: AdminOverviewPanelProps) {
  const avgScrapValue =
    scrapQuotes.length > 0
      ? Math.round(
          scrapQuotes.reduce((acc, q) => acc + (q.estimatedValue || 0), 0) /
            scrapQuotes.length
        )
      : 0;

  const metrics: MetricItem[] = [
    {
      title: "Total Yard Stock",
      value: vehicles.length,
      desc: "Vehicles stationed on-site",
      icon: Car,
      tint: "from-blue-500 to-indigo-500",
    },
    {
      title: "Scrap Estimates",
      value: scrapQuotes.length,
      desc: "Generated scrap reports",
      icon: TrendingUp,
      tint: "from-amber-500 to-red-500",
    },
    {
      title: "Active Part Requests",
      value: partRequests.filter((p) => p.status === "Pending Search").length,
      desc: "Pending inventory search",
      icon: FileText,
      tint: "from-rose-500 to-pink-500",
    },
    {
      title: "Avg Scrap Value",
      value: `£${avgScrapValue}`,
      desc: "Calculated client payout avg",
      icon: ShieldCheck,
      tint: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div
              key={i}
              className="relative p-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="bg-slate-950/60 backdrop-blur-3xl p-6 rounded-[15px] space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                    {metric.title}
                  </span>
                  <div
                    className={`h-8 w-8 bg-gradient-to-tr ${metric.tint} rounded-lg flex items-center justify-center text-white p-1.5 shadow-md shadow-slate-950/50`}
                  >
                    <Icon className="h-full w-full" />
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-mono font-black text-white">
                    {metric.value}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {metric.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide card */}
      <div className="bg-slate-950/45 border border-white/5 rounded-2xl p-6 text-left space-y-3">
        <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
          <Info className="h-4 w-4 text-red-500" />
          Operator Quickstart Information
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-4xl">
          This system represents the actual digital backplane of the RRS Autos
          platform. Use the sub-collection tabs in the navigation above to
          review submissions in real-time. Any status markers you modify will
          reflect instantly in the user&apos;s dashboard inquiries screen. Yard
          removals will immediately clear items from site searching.
        </p>
      </div>
    </div>
  );
}

const AdminOverviewPanel = memo(AdminOverviewPanelInner);
export default AdminOverviewPanel;
