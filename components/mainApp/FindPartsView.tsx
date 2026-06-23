"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { Search, Loader2, ArrowRight, AlertCircle, Check } from "lucide-react";

import {
  mockYardVehicles,
  VEHICLE_MAKES,
  PART_CATEGORIES,
} from "@/lib/mockData";
import { VehicleYard } from "@/types/types";
import type { VehicleYard as PrismaVehicleYard, PartRequestStatus } from "@prisma/client";
import { appendIdToStorage } from "@/lib/utils";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequestPartDialog } from "./RequestPartDialog";
import { getAllVehicleYards, createVehicleYard } from "@/lib/actions/vehicleYardActions";
import { createPartRequest } from "@/lib/actions/partRequestActions";

interface FindPartsViewProps {
  onQuoteAdded: () => void;
}

/* ------------------------------------------------------------------ */
/* Zod Validation Schema for Free-form Lookups                        */
/* ------------------------------------------------------------------ */
const customRequestSchema = z.object({
  make: z.string().trim().min(1, "Vehicle make is required"),
  model: z.string().trim().min(1, "Vehicle model is required"),
  year: z.string().trim().optional(),
  category: z.string().trim().optional(),
  parts: z.string().trim().min(3, "Describe what parts you need (min 3 chars)"),
  name: z.string().trim().min(2, "Enter your full name"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "That number looks too long"),
});

type CustomRequestValues = z.infer<typeof customRequestSchema>;

/* ------------------------------------------------------------------ */
/* Custom reducer state for lookups                                    */
/* ------------------------------------------------------------------ */
interface CallbackState {
  success: boolean;
  errorMsg: string;
}

type CallbackAction =
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "HIDE_SUCCESS" };

const callbackInitialState: CallbackState = {
  success: false,
  errorMsg: "",
};

function callbackReducer(
  state: CallbackState,
  action: CallbackAction,
): CallbackState {
  switch (action.type) {
    case "SUBMIT_START":
      return { ...state, errorMsg: "" };
    case "SUBMIT_SUCCESS":
      return { success: true, errorMsg: "" };
    case "SUBMIT_ERROR":
      return { success: false, errorMsg: action.message };
    case "HIDE_SUCCESS":
      return { ...state, success: false };
    default:
      return state;
  }
}

export default function FindPartsView({ onQuoteAdded }: FindPartsViewProps) {
  const [searchTerm, setSearchTerm] = useReducer(
    (_: string, v: string) => v,
    "",
  );
  const [selectedMake, setSelectedMake] = useReducer(
    (_: string, v: string) => v,
    "ALL_MAKES",
  );
  const [vehicles, setVehicles] = useReducer(
    (_: VehicleYard[], v: VehicleYard[]) => v,
    mockYardVehicles,
  );
  const [loadingVehicles, setLoadingVehicles] = useReducer(
    (_: boolean, v: boolean) => v,
    false,
  );

  // Active vehicle state for dialog
  const [activeVehicle, setActiveVehicle] = useReducer(
    (_: VehicleYard | null, v: VehicleYard | null) => v,
    null,
  );

  // Callback form state machine
  const [state, dispatch] = useReducer(callbackReducer, callbackInitialState);
  const { success, errorMsg } = state;

  const fallbackForm = useForm<CustomRequestValues>({
    resolver: zodResolver(customRequestSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      category: "",
      parts: "",
      name: "",
      phone: "",
    },
  });

  const isMountedRef = useRef(true);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Helper function to convert Prisma vehicle to app type
  const convertPrismaVehicle = (prismaVehicle: PrismaVehicleYard): VehicleYard => {
    return {
      id: prismaVehicle.id,
      make: prismaVehicle.make,
      model: prismaVehicle.model,
      year: prismaVehicle.year,
      trim: prismaVehicle.trim,
      arrivedDate: prismaVehicle.arrivedDate.toISOString(),
      status: prismaVehicle.status.replace("_", " ") as VehicleYard["status"],
      image: prismaVehicle.image,
      color: prismaVehicle.color
    };
  };

  // Fetch real-time vehicles from database API
  useEffect(() => {
    async function fetchVehicles() {
      setLoadingVehicles(true);
      try {
        const list = await getAllVehicleYards();
        if (list && list.length > 0) {
          setVehicles(list.map(convertPrismaVehicle));
        }
      } catch (e) {
        console.warn(
          "Could not fetch database vehicles, holding local fallback:",
          e,
        );
      } finally {
        setLoadingVehicles(false);
      }
    }
    fetchVehicles();
  }, []);

  // Filter list of vehicles in Peterborough breakers yard
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = `${v.make} ${v.model} ${v.trim}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMake = selectedMake === "ALL_MAKES" || v.make === selectedMake;
    return matchesSearch && matchesMake;
  });

  // Handle Free-Form Off-Yard Custom Lookup submission
  const onSubmitCustomRequest = useCallback(
    async (values: CustomRequestValues) => {
      dispatch({ type: "SUBMIT_START" });

      try {
        const partRequest = await createPartRequest({
          vehicleId: "GeneralInquiry",
          vehicleName: `${values.year || "N/A"} ${values.make} ${values.model} (Custom Request)`,
          partsNeeded: `[Category: ${values.category || "Other"}] ${values.parts}`,
          name: values.name.trim(),
          phone: values.phone.trim(),
          status: "Pending_Search" as PartRequestStatus
        });
        
        if (!isMountedRef.current) return;

        appendIdToStorage("rrs_my_part_ids", partRequest.id);
        dispatch({ type: "SUBMIT_SUCCESS" });
        onQuoteAdded();

        // Reset the form fields safely after success
        fallbackForm.reset({
          make: "",
          model: "",
          year: "",
          category: "",
          parts: "",
          name: "",
          phone: "",
        });

        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) dispatch({ type: "HIDE_SUCCESS" });
        }, 8000);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        dispatch({
          type: "SUBMIT_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Something went wrong requesting custom parts.",
        });
      }
    },
    [fallbackForm, onQuoteAdded],
  );

  const submitFallback = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void fallbackForm.handleSubmit(onSubmitCustomRequest)(e);
    },
    [fallbackForm, onSubmitCustomRequest],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 24 },
    },
  };

  const customSubmitting = fallbackForm.formState.isSubmitting;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
      id="find-parts-tab-view"
    >
      {/* Search Header Banner */}
      <motion.div
        variants={{ itemVariants }}
        className="relative p-[1px] bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="bg-slate-950/70 backdrop-blur-3xl p-6 sm:p-8 rounded-[15px] relative z-10">
          <div className="max-w-3xl space-y-3">
            <span className="text-red-500 font-mono text-[9px] uppercase font-bold tracking-widest block">
              Over 200+ donor vehicles stock
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              SEARCH OUR LIVE YARD VEHICLES
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
              Locate vehicles currently stationed in our breakers yard. If you
              find a matching vehicle, lock your part order (bumper, layout,
              panels, engine accessories) and we&apos;ll extract it safely.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5 font-sans">
            <div className="relative group/search">
              <div className="absolute inset-0 bg-red-500 rounded-xl blur opacity-0 group-focus-within/search:opacity-10 transition-opacity"></div>
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-4.5 w-4.5 z-10" />
              <input
                type="text"
                placeholder="Search make or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 text-white placeholder-slate-600 pl-11 pr-4 py-3 h-11 rounded-xl border border-white/5 text-xs font-semibold focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all uppercase relative z-0 font-mono"
              />
            </div>

            <div>
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger className="w-full bg-slate-900 border border-white/5 text-slate-300  rounded-2xl cursor-pointer">
                  <SelectValue placeholder="All Car Makes" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-xl mt-12">
                  <SelectItem value="ALL_MAKES" className="cursor-pointer">
                    All Car Makes
                  </SelectItem>
                  {VEHICLE_MAKES.map((make) => (
                    <SelectItem
                      key={make}
                      value={make}
                      className="cursor-pointer"
                    >
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-900/60 border border-white/5 rounded-xl h-11 px-4.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-bold">RESULT COUNT:</span>
              <span className="text-white font-black">
                {filteredVehicles.length} vehicles
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid of Vehicles */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
          Vehicles in Yard{" "}
          {loadingVehicles && (
            <span className="text-slate-500 normal-case">(refreshing…)</span>
          )}
        </h3>

        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                variants={{ itemVariants }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setActiveVehicle(vehicle)}
                className="bg-slate-950/45 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden cursor-pointer group hover:shadow-[0_20px_40px_rgba(239,68,68,0.15)] hover:border-red-500/30 transition-all duration-300"
                id={`vehicle-card-${vehicle.id}`}
              >
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-3 right-3 bg-slate-950/95 text-emerald-400 border border-white/10 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1 relative z-10 flex items-center space-x-1.5 shadow-lg">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>{vehicle.status}</span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-4 flex justify-between items-end">
                    <span className="text-[9px] text-slate-300 font-mono uppercase bg-slate-950/80 px-2.5 py-1 rounded-md border border-white/5">
                      Arrived: {vehicle.arrivedDate}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2 text-left">
                  <div className="text-[10px] text-red-400 font-mono font-bold tracking-widest uppercase">
                    {vehicle.year} • {vehicle.color}
                  </div>
                  <h4 className="text-md font-black text-white hover:text-red-400 transition-colors uppercase leading-snug">
                    {vehicle.make} {vehicle.model}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed truncate">
                    Variant: {vehicle.trim}
                  </p>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span className="group-hover:text-red-400 transition-colors font-mono font-bold text-[10px] uppercase">
                      Click to request parts
                    </span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform text-slate-600 group-hover:text-red-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-10 border border-white/5 bg-slate-950/45 backdrop-blur-md rounded-2xl text-center text-slate-400 font-mono text-xs">
            ⚠️ No matching vehicles are currently on Oxney Road Yard. Please use
            the custom lookup form below.
          </div>
        )}
      </div>

      {/* Fallback Custom Lookup Form utilizing standard form elements */}
      <motion.div
        variants={{ itemVariants }}
        className="relative p-[1px] bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 rounded-2xl overflow-hidden"
        id="part-request-specific-form"
      >
        <div className="bg-slate-950/70 backdrop-blur-3xl p-6 sm:p-8 rounded-[15px] space-y-6">
          <div className="max-w-2xl space-y-2 mb-6 text-left">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
              Request A Specific Part (Off-Yard Lookups)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Don&apos;t see your specific vehicle variant listed in the yard?
              Complete this request form. Our breakers staff dismantle hundreds
              of vehicles on-site daily and will scan our secure storage vaults
              immediately.
            </p>
          </div>

          <form
            onSubmit={submitFallback}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left"
          >
            {/* Make */}
            <div>
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                Vehicle Make *
              </FieldLabel>
              <Controller
                name="make"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. FORD, VAUXHALL (min 1 char)"
                      className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-bold uppercase font-mono rounded-lg text-xs"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Model */}
            <div>
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                Vehicle Model *
              </FieldLabel>
              <Controller
                name="model"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. FIESTA, ASTRA"
                      className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-bold uppercase font-mono rounded-lg text-xs"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Year */}
            <div>
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                Year / Plate Code
              </FieldLabel>
              <Controller
                name="year"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      placeholder="e.g. 2008 / 57 Plate"
                      className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-semibold uppercase font-mono rounded-lg text-xs"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Part Category */}
            <div>
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                Part Category
              </FieldLabel>
              <Controller
                name="category"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-11 w-full bg-slate-900 border border-white/5 text-slate-300">
                        <SelectValue placeholder="Select Part Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-xl mt-12">
                        {PART_CATEGORIES.map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="cursor-pointer"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Parts Needed Description */}
            <div className="md:col-span-2">
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                What parts do you need? *
              </FieldLabel>
              <Controller
                name="parts"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="e.g. Front bumper skin (Electric Orange), nearside headlight assembly, steering rack..."
                      className="w-full bg-slate-900 border border-white/5 rounded-lg p-3.5 text-xs font-semibold placeholder-slate-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-white"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Full Name */}
            <div>
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                Your Full Name *
              </FieldLabel>
              <Controller
                name="name"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      placeholder="e.g. John Doe"
                      className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-semibold rounded-lg text-xs"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Mobile Phone */}
            <div>
              <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-2 block">
                Mobile Phone *
              </FieldLabel>
              <Controller
                name="phone"
                control={fallbackForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      placeholder="Contact phone (for quotes)"
                      className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-bold font-mono rounded-lg text-xs"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={customSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-red-650 to-pink-650 hover:from-red-600 hover:to-pink-600 text-white py-3.5 px-8 rounded-xl font-bold uppercase text-xs tracking-wider transition-all disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center space-x-2 cursor-pointer border border-white/10 shadow-lg shadow-red-500/10 active:scale-[0.98]"
              >
                {customSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Part Search Inquiry</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="md:col-span-2 p-4 bg-red-950/30 border border-red-900/60 text-rose-400 rounded-xl text-xs font-mono flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="md:col-span-2 p-4 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2"
              >
                <Check className="h-4 w-4 shrink-0 shrink-0" />
                <span>
                  Specific Part Inquiry requested successfully. Our back-office
                  inventory managers will review your request and get back to
                  you with details on Oxney Road spares storage shortly.
                </span>
              </div>
            )}
          </form>
        </div>
      </motion.div>

      {/* Part request overlay Detail Modal - standard shadcn compliant separation */}

      <RequestPartDialog
        vehicle={activeVehicle}
        onClose={() => setActiveVehicle(null)}
        onQuoteAdded={onQuoteAdded}
      />
    </motion.div>
  );
}
