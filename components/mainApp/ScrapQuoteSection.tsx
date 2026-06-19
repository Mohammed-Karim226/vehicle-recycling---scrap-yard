"use client";

import { useReducer, useRef, useEffect, useCallback, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Car,
  MapPin,
  Sparkles,
  Scale,
  Info,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Loader2,
  Phone,
} from "lucide-react";
import { ScrapValuationResult } from "@/types/types";

interface ScrapQuoteSectionProps {
  onQuoteAdded: () => void;
  inlineLayout?: boolean;
}

/* ------------------------------------------------------------------ */
/* localStorage helper — dedupes the copy-pasted try/catch logic that */
/* lived in two places in the original component.                     */
/* ------------------------------------------------------------------ */
function appendIdToStorage(key: string, id: string | undefined) {
  if (!id) return;
  try {
    const raw = localStorage.getItem(key);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded cases.
    // Non-critical — tracking is best-effort, so we swallow silently.
  }
}

/* ------------------------------------------------------------------ */
/* State machine — replaces 6 independent useState calls.             */
/* Guarantees you can never be "loading" AND "confirmed" at once.     */
/* ------------------------------------------------------------------ */
type Status = "idle" | "loading" | "result" | "confirming" | "confirmed";

interface State {
  status: Status;
  registration: string;
  postcode: string;
  contactInfo: string;
  valuation: ScrapValuationResult | null;
  errorMsg: string;
}

type Action =
  | {
      type: "SET_FIELD";
      field: "registration" | "postcode" | "contactInfo";
      value: string;
    }
  | { type: "SUBMIT_QUOTE_START" }
  | { type: "SUBMIT_QUOTE_SUCCESS"; valuation: ScrapValuationResult }
  | { type: "SUBMIT_QUOTE_ERROR"; message: string }
  | { type: "CONFIRM_START" }
  | { type: "CONFIRM_SUCCESS" }
  | { type: "CONFIRM_ERROR"; message: string }
  | { type: "RESET" };

const initialState: State = {
  status: "idle",
  registration: "",
  postcode: "",
  contactInfo: "",
  valuation: null,
  errorMsg: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SUBMIT_QUOTE_START":
      return { ...state, status: "loading", errorMsg: "", valuation: null };
    case "SUBMIT_QUOTE_SUCCESS":
      return { ...state, status: "result", valuation: action.valuation };
    case "SUBMIT_QUOTE_ERROR":
      return { ...state, status: "idle", errorMsg: action.message };
    case "CONFIRM_START":
      return { ...state, status: "confirming", errorMsg: "" };
    case "CONFIRM_SUCCESS":
      return { ...state, status: "confirmed" };
    case "CONFIRM_ERROR":
      return { ...state, status: "result", errorMsg: action.message };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export default function ScrapQuoteSection({
  onQuoteAdded,
  inlineLayout = false,
}: ScrapQuoteSectionProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status, registration, postcode, contactInfo, valuation, errorMsg } =
    state;

  // Tracks whether the component is still mounted, so we never call
  // dispatch() after unmount (the classic source of React memory leaks
  // and "Can't perform a React state update on an unmounted component").
  const isMountedRef = useRef(true);

  // Cancels an in-flight request if the user fires a new one, or the
  // component unmounts, before the previous one resolves.
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleGetQuote = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!registration.trim() || !postcode.trim()) {
        dispatch({
          type: "SUBMIT_QUOTE_ERROR",
          message: "Please fill in both fields correctly.",
        });
        return;
      }

      // Cancel any previous in-flight quote request before starting a new one.
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      dispatch({ type: "SUBMIT_QUOTE_START" });

      try {
        const res = await fetch("/api/valuate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration: registration.trim(),
            postcode: postcode.trim(),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Valuation service is busy. Please try again.");
        }

        const data: ScrapValuationResult = await res.json();

        if (!isMountedRef.current) return; // bail if unmounted mid-fetch

        appendIdToStorage("rrs_my_scrap_ids", data.id);
        dispatch({ type: "SUBMIT_QUOTE_SUCCESS", valuation: data });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return; // expected, not an error
        if (!isMountedRef.current) return;
        dispatch({
          type: "SUBMIT_QUOTE_ERROR",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [registration, postcode],
  );

  const handleConfirmCollection = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!contactInfo.trim() || !valuation) return;

      dispatch({ type: "CONFIRM_START" });

      try {
        const res = await fetch("/api/part-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: "ScrapQuote",
            vehicleName: `Scrap Car: ${valuation.vehicleName} [${valuation.registration}]`,
            partsNeeded: `COMPLETE SCRAP VEHICLE REMOVAL. Postcode: ${valuation.postcode}. Weight: ${valuation.weightKg}kg. Scrap Value: £${valuation.estimatedValue}`,
            name: "Scrap Customer",
            phone: contactInfo.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error("Could not schedule collection.");
        }

        const resData = await res.json();

        if (!isMountedRef.current) return;

        appendIdToStorage("rrs_my_part_ids", resData.requestId);
        dispatch({ type: "CONFIRM_SUCCESS" });
        onQuoteAdded();
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        dispatch({
          type: "CONFIRM_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Failed to confirm collection.",
        });
      }
    },
    [contactInfo, valuation, onQuoteAdded],
  );

  const handleReset = useCallback(() => dispatch({ type: "RESET" }), []);

  const setField =
    (field: "registration" | "postcode" | "contactInfo") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({ type: "SET_FIELD", field, value: e.target.value });

  const loading = status === "loading";
  const submittingContact = status === "confirming";
  const quoteConfirmed = status === "confirmed";

  return (
    <div
      className="relative p-[1px] bg-gradient-to-r from-red-500 via-pink-500 to-amber-500 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      id="quote-widget-container"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_3.5s_infinite] pointer-events-none"></div>

      <div className="bg-slate-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-[15px] relative z-10 space-y-6">
        <AnimatePresence mode="wait">
          {!valuation ? (
            <motion.div
              key="quote-input-fields"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            >
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-red-500" />
                    Instant Scrap Valuation
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">
                    Powered by Live London Metal Exchange Spot Index
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center space-x-2">
                  <div
                    className="text-amber-500 flex font-sans text-xs"
                    aria-hidden="true"
                  >
                    ★★★★★
                  </div>
                  <div className="text-[10px] text-slate-300 font-bold font-mono uppercase">
                    4.8 / 5 Rating
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleGetQuote}
                className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="quote-reg"
                    className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono"
                  >
                    Vehicle Registration
                  </label>
                  <div className="relative group/plate">
                    <div className="absolute inset-0 bg-amber-400 rounded-lg blur opacity-15 group-hover/plate:opacity-30 transition-opacity"></div>
                    <div className="absolute left-1 top-1 bottom-1 w-6 bg-blue-600 rounded-l-md flex flex-col justify-between py-1.5 px-0.5 text-center text-[7px] font-black text-white leading-none font-mono select-none z-10">
                      <span>GB</span>
                      <span className="text-[6px]">★</span>
                    </div>
                    <input
                      id="quote-reg"
                      type="text"
                      required
                      placeholder="e.g. WU04UDA"
                      value={registration}
                      onChange={setField("registration")}
                      className="w-full pl-10 pr-4 py-3 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 placeholder-slate-800/50 font-black font-mono tracking-widest text-lg uppercase border border-amber-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-400/30 text-center relative z-0"
                      maxLength={12}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="quote-postcode"
                    className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono"
                  >
                    Your Postcode
                  </label>
                  <div className="relative group/post">
                    <div className="absolute inset-0 bg-red-500 rounded-lg blur opacity-0 group-focus-within/post:opacity-10 transition-opacity"></div>
                    <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5 z-10" />
                    <input
                      id="quote-postcode"
                      type="text"
                      required
                      placeholder="e.g. PE1 5YP"
                      value={postcode}
                      onChange={setField("postcode")}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-bold font-mono tracking-wide text-md rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 uppercase relative z-0"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <button
                    id="submit-get-quote-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full group bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold uppercase py-3.5 px-6 rounded-lg transition-all shadow-xl active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center space-x-2 tracking-widest text-xs font-mono cursor-pointer border border-white/15"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin text-red-200" />
                        <span>Calculating Rate...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 text-yellow-300 group-hover:rotate-12 transition-transform" />
                        <span>Find Scrap Value</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {errorMsg && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 p-3.5 bg-red-950/30 border border-red-900/60 rounded-lg text-rose-400 text-xs font-mono"
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center space-x-2.5 text-xs text-slate-500 font-mono">
                <Info className="h-4 w-4 text-slate-600 shrink-0" />
                <span>
                  Instant collection towing with crane extraction anywhere in
                  Cambridgeshire. Drive-ins paid immediately.
                </span>
              </div>
            </motion.div>
          ) : !quoteConfirmed ? (
            <motion.div
              key="valuation-results-sec"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="space-y-6 text-left"
            >
              <div className="text-center space-y-2">
                <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full font-mono text-[9px] uppercase font-bold tracking-widest">
                  Vehicle Identifiers Discovered
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3 font-sans leading-tight uppercase">
                  {valuation.vehicleName}
                </h3>

                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="px-2.5 py-1 bg-slate-900 text-amber-400 rounded-md border border-white/5 uppercase font-bold">
                    Reg: {valuation.registration}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 text-stone-200 rounded-md border border-white/5 uppercase font-bold">
                    Eng: {valuation.engineSize}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 text-stone-200 rounded-md border border-white/5 font-bold">
                    Fuel: {valuation.fuelType}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-xl flex flex-col items-center justify-center relative overflow-hidden text-center shadow-inner">
                <div className="absolute top-3 right-3 flex items-center space-x-1.5 text-[8px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-900/30">
                  <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>London Metal Exchange Index</span>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">
                  Guaranteed Scrap Value
                </p>

                <div className="flex items-center justify-center mt-3 text-red-500 font-black text-5xl sm:text-6xl tracking-tight select-all">
                  <span className="text-3xl sm:text-4xl text-red-600 mr-0.5">
                    £
                  </span>
                  {valuation.estimatedValue}
                </div>

                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
                  <Scale className="h-3.5 w-3.5 text-slate-600" />
                  <span>Est. Weight: {valuation.weightKg} kg</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider text-center">
                  🔐 Schedule instant pickup & unlock bank transfer:
                </h4>

                <form
                  onSubmit={handleConfirmCollection}
                  className="space-y-3.5"
                >
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-4.5 w-4.5" />
                    <input
                      type="tel"
                      required
                      placeholder="Your Mobile Phone / Contact Info"
                      value={contactInfo}
                      onChange={setField("contactInfo")}
                      className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-medium font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
                    />
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="p-3 bg-red-950/30 border border-red-900/60 rounded-lg text-rose-400 text-xs font-mono"
                    >
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={submittingContact}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold uppercase py-3.5 px-5 rounded-lg text-xs font-mono tracking-wider transition-all text-center flex items-center justify-center space-x-2 disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer border border-white/10 shadow-lg shadow-emerald-500/10"
                    >
                      {submittingContact ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Book Free Pick-up Slot</span>
                          <ArrowRight className="h-4 w-4 animate-pulse" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-850 hover:text-white border border-white/5 text-slate-400 rounded-lg text-xs font-mono font-bold uppercase transition-colors"
                    >
                      Calculate New
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 bg-emerald-950 border border-emerald-900 rounded-full text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white font-sans uppercase">
                  Collection Booked Live!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Excellent! Our Oxney Road recovery crew has logged your
                  collection request. We will contact you at{" "}
                  <span className="font-mono text-emerald-400 underline font-bold">
                    {contactInfo}
                  </span>{" "}
                  within 15 minutes to organize on-site pickup & immediate
                  payout transfer.
                </p>
              </div>

              <div className="pt-4 max-w-xs mx-auto">
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold py-2.5 px-5 rounded-lg text-xs font-mono border border-white/5 uppercase"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Evaluate another vehicle</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
