"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";

import { RefreshCw, AlertCircle, Clock, Search } from "lucide-react";

import { getAllPartRequests, getAllScrapValuations } from "@/lib/actions";
import type { PartRequest as PrismaPartRequest, ScrapValuation as PrismaScrapValuation } from "@prisma/client";

interface PartQuoteRequest {
  requestId: string;
  vehicleName: string;
  partsNeeded?: string;
  status?: string;
  notes?: string;
  timestamp?: string;
}

interface ScrapValuation {
  id: string;
  vehicleName: string;
  registration?: string;
  estimatedValue: number | string;
  status?: string;
  notes?: string;
  timestamp: string;
}

type LookupMessage = { type: "success" | "error"; text: string } | null;

const SCRAP_IDS_KEY = "rrs_my_scrap_ids";
const PART_IDS_KEY = "rrs_my_part_ids";

// Safe localStorage helpers — never throw on corrupted/missing data or SSR.
function getStoredIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addStoredId(key: string, id: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const ids = getStoredIds(key);
    if (!ids.includes(id)) {
      ids.push(id);
      window.localStorage.setItem(key, JSON.stringify(ids));
    }
    return ids;
  } catch (err) {
    console.error(`Failed to persist ${key}:`, err);
    return getStoredIds(key);
  }
}

// Helper to convert Prisma types to our component types
function convertPartRequest(prismaPart: PrismaPartRequest): PartQuoteRequest {
  return {
    requestId: prismaPart.id,
    vehicleName: prismaPart.vehicleName,
    partsNeeded: prismaPart.partsNeeded,
    status: prismaPart.status.replace("_", " "),
    notes: prismaPart.notes ?? undefined,
    timestamp: prismaPart.createdAt.toISOString()
  };
}

function convertScrapValuation(prismaValuation: PrismaScrapValuation): ScrapValuation {
  let mappedStatus = "Pending Collection";
  if (prismaValuation.status === "Completed") {
    mappedStatus = "Collected";
  } else if (prismaValuation.status === "Rejected") {
    mappedStatus = "Cancelled";
  } else if (prismaValuation.status === "Pending") {
    mappedStatus = "Pending Collection";
  }

  return {
    id: prismaValuation.id,
    vehicleName: prismaValuation.vehicleName,
    registration: prismaValuation.registration,
    estimatedValue: prismaValuation.estimatedValue,
    status: mappedStatus,
    notes: prismaValuation.notes ?? undefined,
    timestamp: prismaValuation.createdAt.toISOString()
  };
}

export default function MyRequestsView() {
  const [partQuotes, setPartQuotes] = useState<PartQuoteRequest[]>([]);
  const [scrapValuations, setScrapValuations] = useState<ScrapValuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<LookupMessage>(null);
  const isFirstRenderRef = useRef(true);

  const fetchSubmissions = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const [prismaPartRequests, prismaScrapValuations] = await Promise.all([
        getAllPartRequests(),
        getAllScrapValuations()
      ]);

      const myScrapIds = getStoredIds(SCRAP_IDS_KEY);
      const myPartIds = getStoredIds(PART_IDS_KEY);

      const allParts = prismaPartRequests.map(convertPartRequest);
      const allScrap = prismaScrapValuations.map(convertScrapValuation);

      setPartQuotes(allParts.filter((p) => myPartIds.includes(p.requestId)));
      setScrapValuations(allScrap.filter((s) => myScrapIds.includes(s.id)));
    } catch (err) {
      console.error("Inquiries fetch went wrong:", err);
      setFetchError("Could not load your requests right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim() || lookupLoading) return;

    const searchId = lookupId.trim().toUpperCase();
    setLookupMessage(null);
    setLookupLoading(true);

    try {
      const [prismaPartRequests, prismaScrapValuations] = await Promise.all([
        getAllPartRequests(),
        getAllScrapValuations()
      ]);

      const allParts = prismaPartRequests.map(convertPartRequest);
      const allScrap = prismaScrapValuations.map(convertScrapValuation);

      const foundPart = allParts.find((p) => p.requestId?.toUpperCase() === searchId);
      const foundScrap = allScrap.find((s) => s.id?.toUpperCase() === searchId);

      if (foundPart) {
        const updatedPartIds = addStoredId(PART_IDS_KEY, foundPart.requestId);
        setPartQuotes(allParts.filter((p) => updatedPartIds.includes(p.requestId)));
        setLookupMessage({ type: "success", text: "Spare request found and linked to device session!" });
        setLookupId("");
      } else if (foundScrap) {
        const updatedScrapIds = addStoredId(SCRAP_IDS_KEY, foundScrap.id);
        setScrapValuations(allScrap.filter((s) => updatedScrapIds.includes(s.id)));
        setLookupMessage({ type: "success", text: "Valuation quote found and linked to device session!" });
        setLookupId("");
      } else {
        setLookupMessage({ type: "error", text: "No active record found matching that code." });
      }
    } catch (err) {
      console.error("Lookup failed:", err);
      setLookupMessage({ type: "error", text: "Service unavailable. Please try again." });
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRenderRef.current) {
      fetchSubmissions();
      isFirstRenderRef.current = false;
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
      id="my-requests-tab-view"
    >

      {/* Tracker Banner Header */}
      <motion.div
        variants={{ itemVariants }}
        className="relative p-[1px] bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="bg-slate-950/70 backdrop-blur-3xl p-6 sm:p-8 rounded-[15px] relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <span className="text-red-500 font-mono text-[9px] uppercase font-bold tracking-widest block">
              Live submission portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              TRACK MY QUOTE REQUESTS
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-normal">
              Review real-time status updates on part inquiries or scrap valuations submitted of your browser sessions.
            </p>

            {/* Quick reference ID lookup input form */}
            <form onSubmit={handleLookup} className="flex flex-wrap gap-2.5 pt-3 max-w-md">
              <label htmlFor="reference-lookup-input" className="sr-only">
                Reference Code
              </label>
              <input
                id="reference-lookup-input"
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter Reference Code (e.g. REQ-...)"
                disabled={lookupLoading}
                className="bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 flex-1 min-w-[180px] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={lookupLoading || !lookupId.trim()}
                className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase font-bold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className={`h-3.5 w-3.5 ${lookupLoading ? "animate-spin" : ""}`} />
                <span>{lookupLoading ? "Searching..." : "Link Ref"}</span>
              </button>
            </form>
            <AnimatePresence>
              {lookupMessage && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="status"
                  className={`text-[10.5px] font-mono pt-1 flex items-center space-x-1 ${
                    lookupMessage.type === "success" ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  <span>{lookupMessage.text}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={fetchSubmissions}
            disabled={loading}
            aria-busy={loading}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-[10px] font-mono font-bold text-white px-4 py-2.5 rounded-xl border border-white/5 transition-all shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-red-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="p-16 border border-white/5 bg-slate-950/45 backdrop-blur-md rounded-2xl text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center space-y-3.5">
          <RefreshCw className="h-6 w-6 animate-spin text-red-500" />
          <span>Connecting to RRS Autos secure cloud index...</span>
        </div>
      ) : fetchError ? (
        <div className="p-16 border border-rose-900/30 bg-rose-950/10 backdrop-blur-md rounded-2xl text-center space-y-3.5">
          <AlertCircle className="h-6 w-6 text-rose-400 mx-auto" />
          <p className="text-rose-400 font-mono text-xs">{fetchError}</p>
          <button
            onClick={fetchSubmissions}
            className="text-[10px] font-mono uppercase font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl border border-white/5 transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">

          {/* Scrap Car Valuations with metallic borders */}
          <div className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-amber-500 pl-3">
              My Scrap Valuations ({scrapValuations.length})
            </h3>

            {scrapValuations.length > 0 ? (
              <div className="space-y-4">
                {scrapValuations.map((val, idx) => (
                  <motion.div
                    key={val.id ?? idx}
                    variants={{itemVariants}}
                    whileHover={{ scale: 1.01 }}
                    className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-black text-white">{val.vehicleName}</h4>
                        <span className="text-[9px] text-amber-400 font-mono uppercase bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-900/40 inline-block font-bold">
                          Reg: {val.registration}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[9px] text-slate-500 font-mono uppercase block tracking-wider">Scrap Payout</span>
                        <span className="text-emerald-400 font-extrabold text-xl font-mono">£{val.estimatedValue}</span>
                        <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded border font-black tracking-widest block transform scale-90 origin-right ${
                          val.status === "Collected"
                            ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/40"
                            : val.status === "Cancelled"
                              ? "bg-rose-950/50 text-rose-400 border-rose-900/40"
                              : "bg-amber-950/50 text-amber-500 border-amber-900/40 animate-pulse"
                        }`}>
                          {val.status || "Pending Collection"}
                        </span>
                      </div>
                    </div>

                    {val.notes && (
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300">
                        <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Backoffice Note:</span>
                        {val.notes}
                      </div>
                    )}

                    <div className="pt-3.5 border-t border-white/5 flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>Ref: {val.id?.substring(0, 8) || "SCRAP-VAL"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(val.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white/[0.01] border border-white/5 rounded-xl text-center text-slate-500 text-xs font-mono leading-relaxed">
                No scrap valuations completed in this session yet. Use the homepage calculator to instantly estimate your car scrap weight value!
              </div>
            )}
          </div>

          {/* Part Spare Inquiries */}
          <div className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
              Spare Part Inquiries ({partQuotes.length})
            </h3>

            {partQuotes.length > 0 ? (
              <div className="space-y-4">
                {partQuotes.map((req, idx) => (
                  <motion.div
                    key={req.requestId ?? idx}
                    variants={{itemVariants}}
                    whileHover={{ scale: 1.01 }}
                    className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-start gap-4 text-left">
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white">{req.vehicleName}</h4>
                        <p className="text-xs text-slate-300 font-sans mt-3 bg-slate-950/50 p-3.5 rounded-xl border border-white/5 whitespace-pre-line leading-relaxed shadow-inner">
                          {req.partsNeeded}
                        </p>
                      </div>
                      <span className={`text-[9px] font-mono uppercase font-black tracking-wider px-3 py-1 rounded-full border shrink-0 ${
                        req.status === "Part Located"
                          ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/40"
                          : req.status === "Shipped"
                            ? "bg-blue-950/50 text-blue-400 border-blue-900/40 animate-pulse"
                            : req.status === "No Stock"
                              ? "bg-rose-950/50 text-rose-400 border-rose-900/30"
                              : req.status === "Cancelled"
                                ? "bg-slate-950/50 text-slate-500 border-white/5"
                                : "bg-amber-950/45 text-amber-500 border-amber-900/30 animate-pulse"
                      }`}>
                        {req.status || "Pending Search"}
                      </span>
                    </div>

                    {req.notes && (
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300">
                        <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Stock Team Feedback:</span>
                        {req.notes}
                      </div>
                    )}

                    <div className="pt-3.5 border-t border-white/5 flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3 w-3 inline" />
                        <span>ID: {req.requestId}</span>
                      </div>
                      <span className={`${
                        req.status === "Part Located" || req.status === "Shipped"
                          ? "text-emerald-400 font-bold"
                          : req.status === "No Stock" || req.status === "Cancelled"
                            ? "text-slate-500"
                            : "text-red-400 font-bold animate-pulse"
                      }`}>
                        {req.status === "Part Located"
                          ? "Offer ready — Check WhatsApp!"
                          : req.status === "Shipped"
                            ? "Dispatched & Tracking live"
                            : req.status === "No Stock"
                              ? "Stock unavailable"
                              : "Inventory Checking Active..."}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white/[0.01] border border-white/5 rounded-xl text-center text-slate-500 text-xs font-mono leading-relaxed">
                No spare part inquiries found. Search yard vehicles to check matching spares and request instant quotes!
              </div>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
}