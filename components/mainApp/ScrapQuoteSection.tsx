"use client";

import { useReducer, useRef, useEffect, useCallback, useId, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { MapPin, Sparkles, Scale, Info, CheckCircle2, RotateCcw, ArrowRight, Loader2, Phone, MessageCircle } from "lucide-react";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatQuotePostcode, formatQuoteRegistration, isCompleteModernRegistration, quoteInputSchema } from "@/lib/validation/schemas";
import { ScrapValuationResult } from "@/types/types";
import { generateScrapValuation } from "@/lib/actions/scrapValuationActions";
import { createPartRequest } from "@/lib/actions/partRequestActions";
import { buildWhatsAppLink, buildScrapQuoteMessage } from "@/lib/whatsapp";

interface ScrapQuoteSectionProps {
  onQuoteAdded: () => void;
  inlineLayout?: boolean;
  onStepChange?: () => void;
}

/* ------------------------------------------------------------------ */
/* localStorage helper                                                 */
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
    // best-effort tracking only — private browsing / quota errors are non-fatal
  }
}

/* ------------------------------------------------------------------ */
/* Zod schemas                                                         */
/* ------------------------------------------------------------------ */
type QuoteFormValues = z.infer<typeof quoteInputSchema>;

const confirmFormSchema = z.object({
  contactInfo: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "That doesn't look like a valid number"),
});
type ConfirmFormValues = z.infer<typeof confirmFormSchema>;

function changeFormattedInput(
  event: ChangeEvent<HTMLInputElement>,
  onChange: (value: string) => void,
  format: (value: string) => string,
  previousValue?: string,
) {
  const input = event.currentTarget;
  const { value, selectionStart } = input;
  const formatted = format(value);
  const inputType = (event.nativeEvent as InputEvent).inputType;
  // Backspace at the end of an automatically inserted space deletes the preceding character.
  if (inputType === "deleteContentBackward" && formatted === previousValue && formatted === `${value} `) {
    onChange(value.slice(0, -1));
    return;
  }
  onChange(formatted);
  if (formatted === value || selectionStart === null || selectionStart === value.length) return;

  // Keep the caret next to the same character when formatting moves a separator.
  const separator = /[\s-]/;
  let remaining = value.slice(0, selectionStart).replace(/[\s-]/g, "").length;
  let caret = 0;
  while (caret < formatted.length && remaining > 0) {
    if (!separator.test(formatted.charAt(caret))) remaining--;
    caret++;
  }

  if (separator.test(formatted.charAt(caret)) && (
    separator.test(value.charAt(selectionStart - 1)) ||
    inputType === "deleteContentForward"
  )) caret++;

  requestAnimationFrame(() => {
    if (document.activeElement === input && input.value === formatted) input.setSelectionRange(caret, caret);
  });
}

/* ------------------------------------------------------------------ */
/* Screen state machine — request lifecycle / server-side errors only. */
/* Field validation is owned by react-hook-form + zod.                 */
/* ------------------------------------------------------------------ */
type Status = "idle" | "result" | "confirmed";

interface State {
  status: Status;
  valuation: ScrapValuationResult | null;
  confirmedContact: string;
  errorMsg: string;
}

type Action =
  | { type: "SUBMIT_QUOTE_SUCCESS"; valuation: ScrapValuationResult }
  | { type: "SUBMIT_QUOTE_ERROR"; message: string }
  | { type: "CONFIRM_START" }
  | { type: "CONFIRM_SUCCESS"; contact: string }
  | { type: "CONFIRM_ERROR"; message: string }
  | { type: "RESET" };

const initialState: State = {
  status: "idle",
  valuation: null,
  confirmedContact: "",
  errorMsg: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SUBMIT_QUOTE_SUCCESS":
      return { ...state, status: "result", valuation: action.valuation, errorMsg: "" };
    case "SUBMIT_QUOTE_ERROR":
      return { ...state, errorMsg: action.message };
    case "CONFIRM_START":
      return { ...state, errorMsg: "" };
    case "CONFIRM_SUCCESS":
      return { ...state, status: "confirmed", confirmedContact: action.contact };
    case "CONFIRM_ERROR":
      return { ...state, errorMsg: action.message };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export default function ScrapQuoteSection({ onQuoteAdded, inlineLayout = true, onStepChange }: ScrapQuoteSectionProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status, valuation, confirmedContact, errorMsg } = state;
  const fieldId = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasShownResultRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const revealStep = useCallback(() => {
    onStepChange?.();
    if (status === "idle" && !hasShownResultRef.current) return;
    hasShownResultRef.current = true;
    // Focus the new heading without letting the browser jump to the phone field.
    stepHeadingRef.current?.focus({ preventScroll: true });
    const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    if (inlineLayout && widgetRef.current && widgetRef.current.getBoundingClientRect().top < headerBottom) {
      widgetRef.current.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [inlineLayout, onStepChange, status]);

  const quoteForm = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteInputSchema),
    defaultValues: { registration: "", postcode: "" },
  });

  const confirmForm = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmFormSchema),
    defaultValues: { contactInfo: "" },
  });

  // Guards against setState-after-unmount and stale/overlapping requests.
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const onSubmitQuote = useCallback(
    async (values: QuoteFormValues) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = await generateScrapValuation(values.registration, values.postcode);
        
        if (!isMountedRef.current) return;

        if ('error' in data) {
          dispatch({ type: "SUBMIT_QUOTE_ERROR", message: data.error });
          return;
        }

        appendIdToStorage("rrs_my_scrap_ids", data.trackingToken);
        confirmForm.reset({ contactInfo: "" });
        dispatch({ type: "SUBMIT_QUOTE_SUCCESS", valuation: data });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!isMountedRef.current) return;
        dispatch({
          type: "SUBMIT_QUOTE_ERROR",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [confirmForm]
  );

  const onSubmitConfirm = useCallback(
    async (values: ConfirmFormValues) => {
      if (!valuation) return;
      dispatch({ type: "CONFIRM_START" });

      try {
        const partRequest = await createPartRequest({
          vehicleId: "ScrapQuote",
          vehicleName: `Scrap Car: ${valuation.vehicleName} [${valuation.registration}]`,
          partsNeeded: `COMPLETE SCRAP VEHICLE REMOVAL. Postcode: ${valuation.postcode}. Weight: ${valuation.weightKg}kg. Scrap Value: £${valuation.estimatedValue}`,
          name: "Scrap Customer",
          phone: values.contactInfo.trim(),
          status: "Pending_Search"
        }, {
          valuationData: valuation,
        });
        
        if (!isMountedRef.current) return;

        appendIdToStorage("rrs_my_part_ids", partRequest.trackingToken);
        dispatch({ type: "CONFIRM_SUCCESS", contact: values.contactInfo.trim() });
        onQuoteAdded();
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        dispatch({
          type: "CONFIRM_ERROR",
          message: err instanceof Error ? err.message : "Failed to confirm collection.",
        });
      }
    },
    [valuation, onQuoteAdded]
  );

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    quoteForm.reset({ registration: "", postcode: "" });
    confirmForm.reset({ contactInfo: "" });
  }, [quoteForm, confirmForm]);

  // react-hook-form's handleSubmit() touches internal ref-backed state, so it
  // must be invoked inside the actual submit event — never called inline in
  // JSX (e.g. onSubmit={form.handleSubmit(fn)}), which runs during render
  // and trips the react-hooks/refs rule.
  const submitQuote = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void quoteForm.handleSubmit(onSubmitQuote)(e);
    },
    [quoteForm, onSubmitQuote]
  );

  const submitConfirm = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void confirmForm.handleSubmit(onSubmitConfirm)(e);
    },
    [confirmForm, onSubmitConfirm]
  );

  const quoteSubmitting = quoteForm.formState.isSubmitting;
  const confirmSubmitting = confirmForm.formState.isSubmitting;
  const quoteConfirmed = status === "confirmed";

  return (
    <div ref={widgetRef} className="relative min-w-0 scroll-mt-36 sm:scroll-mt-40 xl:scroll-mt-24 p-[1px] bg-gradient-to-r from-red-500 via-pink-500 to-amber-500 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_3.5s_infinite] pointer-events-none"></div>

      <div className="bg-slate-950/90 backdrop-blur-3xl p-4 sm:p-6 lg:p-8 rounded-[15px] relative z-10 space-y-6">
        <AnimatePresence mode="wait">
          {!valuation ? (
            <motion.div
              key="quote-input-fields"
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
              onAnimationComplete={revealStep}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            >
              <div className="mb-5 flex flex-col items-start justify-between gap-3 xl:flex-row xl:items-center">
                <div className="min-w-0 text-left">
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans flex items-start gap-2 outline-none">
                    <Sparkles className="mt-1 h-5 w-5 shrink-0 text-red-500" />
                    <span>Instant Scrap Valuation</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">
                    Powered by Live London Metal Exchange Spot Index
                  </p>
                </div>

                <div className="max-w-full bg-white/5 border border-white/10 px-3 py-2 rounded-xl flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="text-amber-500 flex font-sans text-xs" aria-hidden="true">★★★★★</div>
                  <div className="text-[10px] text-slate-300 font-bold font-mono uppercase">4.8 / 5 Rating</div>
                </div>
              </div>

              <form onSubmit={submitQuote} className="grid min-w-0 grid-cols-1 gap-4 items-start sm:grid-cols-2" aria-busy={quoteSubmitting}>
                {/* Registration field */}
                <div className="min-w-0">
                  <FieldLabel htmlFor={`${fieldId}-registration`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 block">
                    Vehicle Registration
                  </FieldLabel>
                  <Controller
                    name="registration"
                    control={quoteForm.control}
                    render={({ field, fieldState }) => {
                      const registrationComplete = isCompleteModernRegistration(field.value);

                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="relative group/plate">
                            <div className="absolute inset-0 bg-amber-400 rounded-lg blur opacity-15 group-hover/plate:opacity-30 transition-opacity"></div>
                            <div className="absolute left-1 top-1 bottom-1 w-6 bg-blue-600 rounded-l-md flex flex-col justify-between py-1.5 px-0.5 text-center text-[7px] font-black text-white leading-none font-mono select-none z-10">
                              <span>GB</span>
                              <span className="text-[6px]">★</span>
                            </div>
                            <Input
                              {...field}
                              id={`${fieldId}-registration`}
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              enterKeyHint="next"
                              onChange={(e) => changeFormattedInput(e, field.onChange, formatQuoteRegistration, field.value)}
                              aria-invalid={fieldState.invalid}
                              aria-describedby={fieldState.invalid ? `${fieldId}-registration-error` : undefined}
                              placeholder="WU04 UDA"
                              className={cn(
                                "h-auto w-full pl-10 pr-4 py-3 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 placeholder-slate-800/50 font-black font-mono tracking-widest text-lg uppercase border rounded-lg focus-visible:outline-none focus-visible:ring-4 text-center relative z-0",
                                registrationComplete
                                  ? "border-emerald-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                                  : "border-amber-600 focus-visible:border-amber-600 focus-visible:ring-amber-400/30"
                              )}
                              maxLength={12}
                            />
                            {registrationComplete && (
                              <motion.span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 z-10 rounded-lg border-2 border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]"
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: reduceMotion ? 1 : [0, 1, 0.45, 1] }}
                                transition={{ duration: reduceMotion ? 0 : 0.75, ease: "easeInOut" }}
                              />
                            )}
                          </div>
                          {fieldState.invalid && <FieldError id={`${fieldId}-registration-error`} errors={[fieldState.error]} />}
                        </Field>
                      );
                    }}
                  />
                </div>

                {/* Postcode field */}
                <div className="min-w-0">
                  <FieldLabel htmlFor={`${fieldId}-postcode`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 block">
                    UK Postcode
                  </FieldLabel>
                  <Controller
                    name="postcode"
                    control={quoteForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="relative group/post">
                          <div className="absolute inset-0 bg-red-500 rounded-lg blur opacity-0 group-focus-within/post:opacity-10 transition-opacity"></div>
                          <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5 z-10" />
                          <Input
                            {...field}
                            id={`${fieldId}-postcode`}
                            autoComplete="postal-code"
                            autoCapitalize="characters"
                            autoCorrect="off"
                            spellCheck={false}
                            enterKeyHint="go"
                            onChange={(e) => changeFormattedInput(e, field.onChange, formatQuotePostcode)}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.invalid ? `${fieldId}-postcode-error` : undefined}
                            placeholder="e.g. PE1 5YP"
                            className={cn(
                              "h-auto min-h-12 w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-white/5 text-white placeholder-slate-500 font-bold font-mono tracking-wide text-base rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 uppercase relative z-0"
                            )}
                            maxLength={10}
                          />
                        </div>
                        {fieldState.invalid && <FieldError id={`${fieldId}-postcode-error`} errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                {/* Submission CTA */}
                <div className="min-w-0 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={quoteSubmitting}
                    className="min-h-12 w-full group bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold uppercase py-3.5 px-4 rounded-lg transition-all shadow-xl active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 tracking-widest text-xs font-mono cursor-pointer border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {quoteSubmitting ? (
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
                <div role="alert" aria-live="assertive" className="mt-4 p-3.5 bg-red-950/30 border border-red-900/60 rounded-lg text-rose-400 text-xs font-mono">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center space-x-2.5 text-xs text-slate-500 font-mono">
                <Info className="h-4 w-4 text-slate-600 shrink-0" />
                <span>Instant collection towing with crane extraction anywhere in Cambridgeshire. Drive-ins paid immediately.</span>
              </div>
            </motion.div>
          ) : !quoteConfirmed ? (
            <motion.div
              key="valuation-results-sec"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -15 }}
              onAnimationComplete={revealStep}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="min-w-0 space-y-5 text-left sm:space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="inline-block max-w-full px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full font-mono text-[9px] uppercase font-bold tracking-widest">
                  Vehicle Identifiers Discovered
                </span>
                <h3 ref={stepHeadingRef} tabIndex={-1} className="break-words text-2xl sm:text-3xl font-black text-white mt-3 font-sans leading-tight uppercase outline-none">
                  {valuation.vehicleName}
                </h3>

                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="px-2.5 py-1 bg-slate-900 text-amber-400 rounded-md border border-white/5 uppercase font-bold">
                    Reg: {formatQuoteRegistration(valuation.registration)}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 text-stone-200 rounded-md border border-white/5 uppercase font-bold">
                    Eng: {valuation.engineSize}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 text-stone-200 rounded-md border border-white/5 font-bold">
                    Fuel: {valuation.fuelType}
                  </span>
                  {valuation.colour && valuation.colour !== 'Unknown' && (
                    <span className="px-2.5 py-1 bg-slate-900 text-stone-200 rounded-md border border-white/5 font-bold uppercase">
                      Colour: {valuation.colour}
                    </span>
                  )}
                  {valuation.mileage && (
                    <span className="px-2.5 py-1 bg-slate-900 text-cyan-400 rounded-md border border-white/5 font-bold uppercase">
                      Odometer: {valuation.mileage}
                    </span>
                  )}
                </div>

                {valuation.motStatus && (
                  <div className="mt-3 flex justify-center">
                    {valuation.motStatus === 'Valid' || valuation.motStatus === 'Active' ? (
                      <span className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-xl font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                        MOT: {valuation.motStatus}{valuation.motExpiryDate ? ` (Expires ${valuation.motExpiryDate})` : ''}
                      </span>
                    ) : valuation.motStatus === 'Not valid' || valuation.motStatus === 'Expired' ? (
                      <span className="px-3 py-1.5 bg-amber-950/80 border border-amber-500/30 text-amber-400 rounded-xl font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-amber-500 rounded-full shrink-0" />
                        MOT: {valuation.motStatus}{valuation.motExpiryDate ? ` (Expiry ${valuation.motExpiryDate})` : ''}
                      </span>
                    ) : valuation.motStatus === 'Failed' ? (
                      <span className="px-3 py-1.5 bg-rose-950/80 border border-rose-500/30 text-rose-400 rounded-xl font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-rose-500 rounded-full shrink-0" />
                        MOT: Failed{valuation.motExpiryDate ? ` (Expiry ${valuation.motExpiryDate})` : ''}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-900 border border-white/5 text-slate-400 rounded-xl font-mono text-[9px] uppercase font-bold tracking-wider">
                        MOT: {valuation.motStatus}{valuation.motExpiryDate ? ` (Expiry ${valuation.motExpiryDate})` : ''}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-[10px] leading-relaxed text-slate-400">
                  Contains public sector information licensed under the{' '}
                  <a
                    href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-slate-200"
                  >
                    Open Government Licence v3.0
                  </a>.
                </p>
              </div>

              <div className="min-w-0 bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl flex flex-col items-center justify-center gap-3 relative overflow-hidden text-center shadow-inner">
                <div className="inline-flex max-w-full items-center justify-center gap-1.5 text-[8px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-900/30">
                  <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>London Metal Exchange Index</span>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">Guaranteed Scrap Value</p>

                <div className="flex max-w-full items-baseline justify-center text-red-500 font-black text-[clamp(2.5rem,10vw,3.75rem)] tracking-tight tabular-nums select-all">
                  <span className="text-3xl sm:text-4xl text-red-600 mr-0.5">£</span>
                  {valuation.estimatedValue}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Scale className="h-3.5 w-3.5 text-slate-600" />
                  <span>Est. Weight: {valuation.weightKg} kg</span>
                </div>
              </div>

              {valuation.defects && valuation.defects.length > 0 && (
                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 space-y-3 text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest flex items-center gap-2">
                    <Info className="h-4.5 w-4.5 text-red-500/70" />
                    Recent MOT Advisories & Defects
                  </h4>
                  <ul className="space-y-2 text-[11px] font-mono text-slate-300">
                    {valuation.defects.map((defect, idx) => {
                      const isAdvisory = defect.toUpperCase().startsWith('ADVISORY');
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <span className={cn(
                            "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                            isAdvisory ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                          )} />
                          <span>{defect}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="min-w-0 bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider text-center">
                  🔐 Schedule instant pickup & unlock bank transfer:
                </h4>

                <form onSubmit={submitConfirm} className="space-y-3.5">
                  <FieldLabel htmlFor={`${fieldId}-contact`} className="text-xs text-slate-300">Mobile phone number</FieldLabel>
                  <Controller
                    name="contactInfo"
                    control={confirmForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-4.5 w-4.5 z-10" />
                          <Input
                            {...field}
                            id={`${fieldId}-contact`}
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            enterKeyHint="done"
                            placeholder="Your mobile number"
                            className={cn(
                              "h-auto min-h-12 w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 text-white placeholder-slate-500 font-medium font-mono rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-base"
                            )}
                          />
                        </div>
                        <FieldDescription className="text-emerald-400 text-xs mt-2 flex items-start gap-2">
                          <span className="mt-1 inline-block w-2 h-2 shrink-0 bg-emerald-400 rounded-full animate-ping" />
                          We&apos;ll text you within 15 minutes to confirm pickup
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {errorMsg && (
                    <div role="alert" aria-live="assertive" className="p-3 bg-red-950/30 border border-red-900/60 rounded-lg text-rose-400 text-xs font-mono">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    {valuation && (
                      <a
                        href={buildWhatsAppLink({
                          recipientPhone: process.env.NEXT_PUBLIC_RECIPIENT_WHATSAPP || "07309580006",
                          message: buildScrapQuoteMessage(valuation),
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-12 min-w-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-[0.98] text-white font-extrabold uppercase py-3 px-3 rounded-lg text-xs font-mono tracking-wide transition-all text-center flex items-center justify-center gap-2 cursor-pointer border border-white/10 shadow-lg shadow-green-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        <span>Send Quote via WhatsApp</span>
                      </a>
                    )}

                    <button
                      type="submit"
                      disabled={confirmSubmitting}
                      className="min-h-12 min-w-0 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold uppercase py-3 px-3 rounded-lg text-xs font-mono tracking-wide transition-all text-center flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer border border-white/10 shadow-lg shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      {confirmSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Book Free Pick-up Slot</span>
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-11 px-4 py-3 bg-slate-900 hover:bg-slate-800 hover:text-white border border-white/5 text-slate-400 rounded-lg text-xs font-mono font-bold uppercase transition-colors sm:col-span-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onAnimationComplete={revealStep}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 bg-emerald-950 border border-emerald-900 rounded-full text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h3 ref={stepHeadingRef} tabIndex={-1} className="break-words text-xl sm:text-2xl font-black text-white font-sans uppercase outline-none">Collection Booked Live!</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Excellent! Our Oxney Road recovery crew has logged your collection request. We will contact you at{" "}
                  <span className="break-all font-mono text-emerald-400 underline font-bold">{confirmedContact}</span> within 15 minutes to
                  organize on-site pickup & immediate payout transfer.
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
