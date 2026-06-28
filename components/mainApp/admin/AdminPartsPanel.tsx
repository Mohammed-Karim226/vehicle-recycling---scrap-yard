"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { Search, Save, RefreshCw, Phone, Trash2 } from "lucide-react";
import type { PartQuoteSubmitted } from "@/types/types";
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
interface AdminPartsPanelProps {
  partRequests: PartQuoteSubmitted[];
  actionLoading: string | null;
  onUpdateStatus: (requestId: string, status: string, notes: string) => Promise<void>;
  onDelete?: (requestId: string) => Promise<boolean>;
}

// ────────────────────────────────────────────────────────────
// Part Request Row Card (memoized inner component)
// ────────────────────────────────────────────────────────────
interface PartRequestRowCardProps {
  req: PartQuoteSubmitted;
  actionLoading: string | null;
  onUpdate: (requestId: string, status: string, notes: string) => Promise<void>;
  onDelete?: (requestId: string) => Promise<boolean>;
}

const PartRequestRowCard = memo(function PartRequestRowCard({
  req,
  actionLoading,
  onUpdate,
  onDelete,
}: PartRequestRowCardProps) {
  const [notes, setNotes] = useState(req.notes || "");
  const [status, setStatus] = useState<string>(req.status || "Pending Search");
  const [dirty, setDirty] = useState(false);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setDirty(true);
  }, []);

  const handleCommit = useCallback(() => {
    onUpdate(req.requestId, status, notes);
  }, [req.requestId, status, notes, onUpdate]);

  const isModified = dirty || req.notes !== notes || req.status !== status;
  const isLoading = actionLoading === req.requestId;

  // Sanitize phone for WhatsApp link
  const sanitizedPhone = req.phone?.replace(/[^0-9+]/g, "") ?? "";

  return (
    <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between gap-5 text-left">
      <div className="space-y-3.5 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[9px] text-red-400 font-mono uppercase bg-red-950/50 px-2.5 py-0.5 rounded border border-red-900/40 font-bold tracking-widest leading-none">
            {req.requestId}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {req.timestamp ? new Date(req.timestamp).toLocaleString() : "—"}
          </span>
        </div>

        <div>
          <span className="text-[9px] text-slate-500 font-mono uppercase leading-none block mb-0.5">
            Donor Vehicle Source
          </span>
          <h4 className="text-sm font-black text-white">{req.vehicleName}</h4>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 text-xs text-slate-300 whitespace-pre-line leading-relaxed shadow-inner">
          <span className="text-[8px] text-slate-500 font-mono uppercase block mb-1">
            Parts Demanded:
          </span>
          {req.partsNeeded}
        </div>

        {/* Notes block */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-mono uppercase block">
            Operator Remarks / Part Located details
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="e.g. Part found in back warehouse. Wing in silver color. Offered £40 + shipping."
            className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
            rows={2}
          />
        </div>
      </div>

      <div className="md:w-60 flex flex-col justify-between items-stretch md:items-end gap-3 md:text-right">
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase block">
            Contact Demands
          </span>
          <h5 className="font-extrabold text-sm text-white font-mono">
            {req.name}
          </h5>

          <a
            href={`https://wa.me/${sanitizedPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-emerald-400 hover:text-white font-mono flex items-center justify-start md:justify-end gap-1 mt-1 transition-all"
          >
            <Phone className="h-3 w-3 inline text-emerald-500" />
            <span>WhatsApp {req.phone}</span>
          </a>
        </div>

        <div className="space-y-2.5 w-full">
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 font-mono uppercase block text-left md:text-right">
              Work Queue Status
            </label>
            <Select value={status} onValueChange={(val) => { setStatus(val); setDirty(true); }}>
              <SelectTrigger className="w-full bg-slate-950 text-xs text-slate-300 font-mono border border-white/5 rounded-lg h-9">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border border-white/10 text-slate-300 font-mono text-xs shadow-xl mt-12">
                <SelectItem value="Pending Search">Pending Search</SelectItem>
                <SelectItem value="Part Located">Part Located</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="No Stock">No Stock</SelectItem>
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
                if (confirm("Are you sure you want to permanently delete this part request?")) {
                  onDelete(req.requestId);
                }
              }}
              disabled={isLoading}
              className="w-full bg-red-950/40 hover:bg-red-900/40 text-red-400 font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 border border-red-900/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Request</span>
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
function AdminPartsPanelInner({
  partRequests,
  actionLoading,
  onUpdateStatus,
  onDelete,
}: AdminPartsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value),
    []
  );

  const filteredParts = useMemo(() => {
    let result = partRequests;
    if (statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter((p) =>
      `${p.name} ${p.partsNeeded} ${p.vehicleName} ${p.phone}`
        .toLowerCase()
        .includes(term)
    );
  }, [partRequests, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search bar & Filters */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <input
              id="admin-parts-search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by customer name, requested part descriptions, phone..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/10 font-mono"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["All", "Pending Search", "Part Located", "Shipped", "No Stock", "Cancelled"].map((status) => (
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

      {filteredParts.length > 0 ? (
        <div className="space-y-4">
          {filteredParts.map((req) => (
            <PartRequestRowCard
              key={`${req.requestId}-${req.status}-${req.notes ?? ""}`}
              req={req}
              actionLoading={actionLoading}
              onUpdate={onUpdateStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 border border-white/5 bg-slate-950/20 text-center rounded-2xl text-slate-500 font-mono text-xs">
          No matching part requests found in the pipeline.
        </div>
      )}
    </div>
  );
}

const AdminPartsPanel = memo(AdminPartsPanelInner);
export default AdminPartsPanel;
