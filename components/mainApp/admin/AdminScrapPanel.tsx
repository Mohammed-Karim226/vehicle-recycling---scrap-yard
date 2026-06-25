"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Search, Save, RefreshCw, Trash2 } from "lucide-react";
import type { ScrapValuationResult } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface AdminScrapPanelProps {
  scrapQuotes: ScrapValuationResult[];
  actionLoading: string | null;
  onUpdateStatus: (quoteId: string, status: string, notes: string) => Promise<void>;
  onDelete?: (quoteId: string) => Promise<boolean>;
}

// ────────────────────────────────────────────────────────────
// Quote Row Card (memoized inner component)
// ────────────────────────────────────────────────────────────
interface QuoteRowCardProps {
  quote: ScrapValuationResult;
  actionLoading: string | null;
  onUpdate: (quoteId: string, status: string, notes: string) => Promise<void>;
  onDelete?: (quoteId: string) => Promise<boolean>;
}

const QuoteRowCard = memo(function QuoteRowCard({
  quote,
  actionLoading,
  onUpdate,
  onDelete,
}: QuoteRowCardProps) {
  const [notes, setNotes] = useState(quote.notes || "");
  const [status, setStatus] = useState(quote.status || "Pending Inspection");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setNotes(quote.notes || "");
    setStatus(quote.status || "Pending Inspection");
    setDirty(false);
  }, [quote.notes, quote.status]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setDirty(true);
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setDirty(true);
  }, []);

  const handleCommit = useCallback(() => {
    if (!quote.id) return;
    onUpdate(quote.id, status, notes);
  }, [quote.id, status, notes, onUpdate]);

  const isModified = dirty || quote.notes !== notes || quote.status !== status;
  const isLoading = actionLoading === quote.id;

  return (
    <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between gap-5 text-left">
      <div className="space-y-3.5 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[14px] bg-yellow-400 text-slate-950 font-black font-mono uppercase px-3.5 py-1.5 rounded-md border-2 border-slate-950 tracking-wider shadow-[3px_3px_0px_#000] inline-block select-all">
            {quote.registration}
          </span>
          <span className="text-[10px] text-slate-500 font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-full uppercase">
            Postcode: {quote.postcode}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {quote.timestamp ? new Date(quote.timestamp).toLocaleString() : "—"}
          </span>
        </div>

        <div>
          <h4 className="text-md font-black text-white">{quote.vehicleName}</h4>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Weight: {quote.weightKg} kg • Fuel: {quote.fuelType} • Engine:{" "}
            {quote.engineSize}
          </p>
        </div>

        {/* Notes block */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase block">
            Internal Admin Notes
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="e.g. Towing requested. Crane needed. Back bumper missing."
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
            rows={2}
          />
        </div>
      </div>

      <div className="md:w-60 flex flex-col justify-between items-stretch md:items-end gap-3 md:text-right">
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase block">
            Calculated Worth
          </span>
          <span className="text-emerald-400 font-mono font-extrabold text-2xl">
            £{quote.estimatedValue}
          </span>
        </div>

        <div className="space-y-2.5 w-full">
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 font-mono uppercase block text-left md:text-right">
              Valuation Status
            </label>
            <Select value={status} onValueChange={(val) => { setStatus(val); setDirty(true); }}>
              <SelectTrigger className="w-full bg-slate-950 text-xs text-slate-300 font-mono border border-white/5 rounded-lg h-9">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border border-white/10 text-slate-300 font-mono text-xs shadow-xl mt-12">
                <SelectItem value="Pending Inspection">Pending Inspection</SelectItem>
                <SelectItem value="Collected">Collected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isModified && (
            <button
              onClick={handleCommit}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Commit Changes</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete this scrap quote?")) {
                  onDelete(quote.id!);
                }
              }}
              disabled={isLoading}
              className="w-full bg-red-950/40 hover:bg-red-900/40 text-red-400 font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 border border-red-900/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Quote</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ────────────────────────────────────────────────────────────
// Main Panel
// ────────────────────────────────────────────────────────────
function AdminScrapPanelInner({
  scrapQuotes,
  actionLoading,
  onUpdateStatus,
  onDelete,
}: AdminScrapPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value),
    []
  );

  const filteredQuotes = useMemo(() => {
    let result = scrapQuotes;
    if (statusFilter !== "All") {
      result = result.filter((q) => q.status === statusFilter);
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter((q) =>
      `${q.registration} ${q.vehicleName} ${q.postcode}`
        .toLowerCase()
        .includes(term)
    );
  }, [scrapQuotes, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search bar & Filters */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <input
              id="admin-scrap-search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by registration plate, car description, postcode..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/10 font-mono"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["All", "Pending Inspection", "Collected", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                statusFilter === status
                  ? "bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent shadow-lg"
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredQuotes.length > 0 ? (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <QuoteRowCard
              key={quote.id}
              quote={quote}
              actionLoading={actionLoading}
              onUpdate={onUpdateStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 border border-white/5 bg-slate-950/20 text-center rounded-2xl text-slate-500 font-mono text-xs">
          No matching scrap estimates located in database.
        </div>
      )}
    </div>
  );
}

const AdminScrapPanel = memo(AdminScrapPanelInner);
export default AdminScrapPanel;
