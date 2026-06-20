"use client";

import { useReducer, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Loader2, Check, AlertCircle } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VehicleYard } from "@/types/types";
import { appendIdToStorage } from "@/lib/utils";

interface RequestPartDialogProps {
  vehicle: VehicleYard | null;
  onClose: () => void;
  onQuoteAdded: () => void;
}

const requestFormSchema = z.object({
  partsNeeded: z
    .string()
    .trim()
    .min(3, "Describe what part(s) you need (min 3 chars)"),
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name"),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "That number looks too long"),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

type Status = "idle" | "success";

interface State {
  status: Status;
  submittedRequestId: string | null;
  errorMsg: string;
}

type Action =
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; requestId: string }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "RESET" };

const initialState: State = {
  status: "idle",
  submittedRequestId: null,
  errorMsg: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SUBMIT_START":
      return { ...state, errorMsg: "" };
    case "SUBMIT_SUCCESS":
      return { ...state, status: "success", submittedRequestId: action.requestId };
    case "SUBMIT_ERROR":
      return { ...state, errorMsg: action.message };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function RequestPartDialog({ vehicle, onClose, onQuoteAdded }: RequestPartDialogProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status, submittedRequestId, errorMsg } = state;

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: { partsNeeded: "", customerName: "", customerPhone: "" },
  });

  // Reset form when modal opens with a new vehicle
  useEffect(() => {
    if (vehicle) {
      dispatch({ type: "RESET" });
      form.reset({ partsNeeded: "", customerName: "", customerPhone: "" });
    }
  }, [vehicle, form]);

  const onSubmit = useCallback(
    async (values: RequestFormValues) => {
      if (!vehicle) return;
      dispatch({ type: "SUBMIT_START" });

      try {
        const res = await fetch("/api/part-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.trim})`,
            partsNeeded: values.partsNeeded.trim(),
            name: values.customerName.trim(),
            phone: values.customerPhone.trim(),
          }),
        });

        if (!res.ok) throw new Error("Could not execute request at this time.");

        const payload = await res.json();
        appendIdToStorage("rrs_my_part_ids", payload.requestId);
        dispatch({ type: "SUBMIT_SUCCESS", requestId: payload.requestId });
        onQuoteAdded();
      } catch (err: unknown) {
        dispatch({
          type: "SUBMIT_ERROR",
          message: err instanceof Error ? err.message : "Failed to send parts request. Please try again.",
        });
      }
    },
    [vehicle, onQuoteAdded]
  );

  const submitRequest = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit]
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={!!vehicle} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[85vh] overflow-y-auto border border-white/10 bg-slate-950/95 backdrop-blur-3xl text-left select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-red-500/5 to-transparent pointer-events-none"></div>

        {vehicle && (
          <>
            {status !== "success" ? (
              <div className="space-y-4">
                <DialogHeader className="space-y-1.5">
                  <span className="text-red-400 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center mb-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Arrived: {vehicle.arrivedDate}
                  </span>
                  <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 font-mono">
                    Variant & Color: {vehicle.trim} • {vehicle.color}
                  </DialogDescription>
                </DialogHeader>

                <div className="h-36 rounded-xl overflow-hidden border border-white/5 relative bg-slate-900">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <form onSubmit={submitRequest} className="space-y-4.5">
                  {/* Parts required field */}
                  <div>
                    <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
                      What part(s) do you need? *
                    </FieldLabel>
                    <Controller
                      name="partsNeeded"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Input
                            {...field}
                            placeholder="e.g. Front Bumper, OE Headlight, Side Door Glass..."
                            className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-700 font-semibold focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  {/* Customer details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
                        Your Name *
                      </FieldLabel>
                      <Controller
                        name="customerName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              {...field}
                              placeholder="e.g. John"
                              className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-700 focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </div>

                    <div>
                      <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
                        Phone Number *
                      </FieldLabel>
                      <Controller
                        name="customerPhone"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="e.g. 07340 765940"
                              className="h-11 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-700 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div role="alert" aria-live="assertive" className="p-3 bg-red-950/30 border border-red-900/60 text-rose-400 rounded-lg text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-555 hover:to-pink-555 text-white py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer border border-white/10 shadow-lg shadow-red-500/10 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-red-200" />
                        <span>Requesting Quote...</span>
                      </>
                    ) : (
                      <span>Request Part Quote</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-5">
                <div className="h-14 w-14 bg-emerald-950/80 border border-emerald-900 rounded-full flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/10">
                  <Check className="h-8 w-8" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-mono text-emerald-400 font-bold uppercase tracking-widest">
                    Quote Requested Successfully!
                  </h4>
                  <p className="text-xs text-slate-400">We&apos;ve assigned a designated tracking reference number to your request:</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-white/5 font-mono space-y-1.5 text-center select-all shadow-inner">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Request Reference ID</span>
                  <div className="text-white font-black text-lg tracking-wide">{submittedRequestId}</div>
                </div>

                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Our Peterborough breakers yard team will check the physical vehicle inventory on{" "}
                  <strong>
                    {vehicle.make} {vehicle.model}
                  </strong>{" "}
                  and contact you with a direct price and extract status details shortly.
                </p>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-200 font-bold text-xs font-mono py-2.5 px-6 rounded-lg uppercase transition-colors cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
