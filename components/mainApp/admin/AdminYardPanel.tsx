"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { motion } from "motion/react";
import { Search, Sliders, Trash2, Plus, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { VehicleYard } from "@/types/types";
import type { NewVehicleFormData } from "./useAdminData";
import { INITIAL_VEHICLE_FORM } from "./useAdminData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// ────────────────────────────────────────────────────────────
// Zod Schema
// ────────────────────────────────────────────────────────────
const addVehicleSchema = z.object({
  make: z
    .string()
    .min(1, "Make is required")
    .max(50, "Make must be 50 characters or less"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(50, "Model must be 50 characters or less"),
  year: z
    .number()
    .int("Year must be a whole number")
    .min(1960, "Year must be 1960 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z
    .string()
    .min(1, "Color is required")
    .max(40, "Color must be 40 characters or less"),
  trim: z
    .string()
    .min(1, "Trim / engine designation is required")
    .max(80, "Trim must be 80 characters or less"),
  arrivedDate: z
    .string()
    .min(1, "Arrival date is required"),
  image: z.string().optional(),
});

type AddVehicleSchema = z.infer<typeof addVehicleSchema>;

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface AdminYardPanelProps {
  vehicles: VehicleYard[];
  actionLoading: string | null;
  onUpdateStatus: (vehicleId: string, status: string) => Promise<void>;
  onDelete: (vehicleId: string) => Promise<boolean>;
  onAdd: (formData: NewVehicleFormData) => Promise<boolean>;
}

// ────────────────────────────────────────────────────────────
// Vehicle Card (memoized)
// ────────────────────────────────────────────────────────────
interface VehicleCardProps {
  vehicle: VehicleYard;
  actionLoading: string | null;
  onStatusChange: (vehicleId: string, status: string) => Promise<void>;
  onDelete: (vehicleId: string) => void;
}

const VehicleCard = memo(function VehicleCard({
  vehicle,
  actionLoading,
  onStatusChange,
  onDelete,
}: VehicleCardProps) {
  const handleStatusChange = useCallback(
    (value: string) => {
      onStatusChange(vehicle.id, value);
    },
    [vehicle.id, onStatusChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(vehicle.id);
  }, [vehicle.id, onDelete]);

  return (
    <motion.div
      className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between"
      whileHover={{ y: -2 }}
    >
      <div className="flex gap-4 p-4">
        <img
          src={vehicle.image}
          alt={`${vehicle.make} ${vehicle.model}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-16 w-20 rounded-lg object-cover border border-white/10 shrink-0"
        />
        <div className="space-y-1.5 text-left">
          <span className="text-[8px] text-red-500 font-mono uppercase bg-red-950/50 px-2 py-0.5 rounded border border-red-900/30 font-bold">
            ID: {vehicle.id}
          </span>
          <h4 className="text-xs font-black text-white">
            {vehicle.make} {vehicle.model}
          </h4>
          <p className="text-[10px] text-slate-400 font-mono leading-none">
            {vehicle.trim}
          </p>
          <p className="text-[9px] text-slate-500 font-mono leading-none">
            Color: {vehicle.color} • ({vehicle.year})
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-white/[0.03] bg-black/20 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <Sliders className="h-3 w-3 text-slate-500" />
          <Select value={vehicle.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full bg-slate-950 text-xs text-slate-300 font-mono border border-white/5 rounded-lg h-9">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border border-white/10 text-slate-300 font-mono text-xs shadow-xl mt-12 cursor-pointer">
              <SelectItem value="In Yard">In Yard</SelectItem>
              <SelectItem value="Dismantled">Dismantled</SelectItem>
              <SelectItem value="Scrapped">Scrapped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={handleDelete}
          disabled={actionLoading === `del-${vehicle.id}`}
          className="h-7 w-7 bg-red-950/20 hover:bg-red-900 border border-red-900/40 rounded-lg flex items-center justify-center text-red-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
});

// ────────────────────────────────────────────────────────────
// Add Vehicle Form (memoized)
// ────────────────────────────────────────────────────────────
interface AddVehicleFormProps {
  actionLoading: string | null;
  onAdd: (formData: NewVehicleFormData) => Promise<boolean>;
}

const AddVehicleForm = memo(function AddVehicleForm({
  actionLoading,
  onAdd,
}: AddVehicleFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddVehicleSchema>({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      make: INITIAL_VEHICLE_FORM.make ?? "",
      model: INITIAL_VEHICLE_FORM.model ?? "",
      year: INITIAL_VEHICLE_FORM.year ?? new Date().getFullYear(),
      color: INITIAL_VEHICLE_FORM.color ?? "",
      trim: INITIAL_VEHICLE_FORM.trim ?? "",
      arrivedDate: INITIAL_VEHICLE_FORM.arrivedDate ?? "",
      image: INITIAL_VEHICLE_FORM.image ?? "",
    },
  });

  const watchedArrivedDate = watch("arrivedDate");

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const onSubmit = useCallback(
    async (data: AddVehicleSchema) => {
      const payload: NewVehicleFormData = {
        ...INITIAL_VEHICLE_FORM,
        ...data,
        image: imagePreview || data.image || "",
      };
      const success = await onAdd(payload);
      if (success) {
        reset();
        setImagePreview("");
        setShowSuccess(true);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setShowSuccess(false), 3000);
      }
    },
    [onAdd, reset, imagePreview]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setImagePreview(result);
          setValue("image", result, { shouldValidate: true });
        };
        reader.readAsDataURL(file);
      }
    },
    [setValue]
  );

  const isSubmitting = actionLoading === "add-vehicle";

  // Derive the ISO date string for the native date input
  const isoDateValue = useMemo(() => {
    if (!watchedArrivedDate) return "";
    let date = new Date(watchedArrivedDate);
    if (isNaN(date.getTime())) {
      const parts = watchedArrivedDate.split(" ");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months.findIndex((m) =>
          m.toLowerCase().startsWith(parts[1].toLowerCase())
        );
        if (month !== -1) date = new Date(parseInt(parts[2]), month, day);
      }
    }
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  }, [watchedArrivedDate]);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val) {
        const formatted = new Date(val).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        setValue("arrivedDate", formatted, { shouldValidate: true });
      } else {
        setValue("arrivedDate", "", { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <div className="lg:col-span-1 bg-slate-950/45 border border-white/5 rounded-2xl p-6 h-fit space-y-5">
      <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
        Register Donor Vehicle
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">

        {/* ── Make / Model ── */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
              Make *
            </FieldLabel>
            <Controller
              name="make"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    placeholder="e.g. BMW"
                    className="h-9 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div>
            <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
              Model *
            </FieldLabel>
            <Controller
              name="model"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    placeholder="e.g. 5 Series"
                    className="h-9 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </div>

        {/* ── Year / Color ── */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
              Year *
            </FieldLabel>
            <Controller
              name="year"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    type="number"
                    placeholder="e.g. 2008"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="h-9 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div>
            <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
              Color *
            </FieldLabel>
            <Controller
              name="color"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    placeholder="e.g. Carbon Black"
                    className="h-9 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </div>

        {/* ── Trim ── */}
        <div>
          <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
            Trim or Engine Designation *
          </FieldLabel>
          <Controller
            name="trim"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  placeholder="e.g. 530d M-Sport (E60)"
                  className="h-9 w-full bg-slate-900 border border-white/5 text-white placeholder-slate-600 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 rounded-lg text-xs"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* ── Arrived Date ── */}
        <div>
          <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
            Arrived Date *
          </FieldLabel>
          <Controller
            name="arrivedDate"
            control={control}
            render={({ fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none text-left cursor-pointer hover:border-white/10 transition-colors data-[invalid=true]:border-red-500"
                      data-invalid={fieldState.invalid}
                    >
                      <span className={watchedArrivedDate ? "text-white" : "text-slate-600"}>
                        {watchedArrivedDate || "Select Date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3.5 bg-slate-950 border border-white/10 text-white rounded-xl shadow-2xl z-50">
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 font-mono uppercase block">
                        Select Arrival Date
                      </span>
                      <input
                        type="date"
                        value={isoDateValue}
                        onChange={handleDateChange}
                        className="bg-slate-900 text-xs text-white font-mono border border-white/10 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-red-500 scheme-dark"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* ── Image ── */}
        <div>
          <FieldLabel className="text-[9px] font-bold uppercase tracking-widest font-mono text-slate-400 mb-1.5 block">
            Donor Stock Image
          </FieldLabel>
          <Controller
            name="image"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex flex-col gap-2.5 bg-slate-900 border border-white/5 rounded-lg p-3.5">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">
                      Upload File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-400 font-mono file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:font-mono file:uppercase file:bg-red-600 file:text-white file:cursor-pointer hover:file:opacity-90 transition-all"
                    />
                  </div>

                  <div className="text-[9px] text-slate-600 font-mono text-center font-bold">
                    — OR —
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">
                      Paste Image URL
                    </span>
                    <Input
                      {...field}
                      value={imagePreview.startsWith("data:") ? "" : (field.value ?? "")}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono focus-visible:ring-red-500 focus-visible:border-red-500 h-8"
                    />
                  </div>

                  {(imagePreview || field.value) && (
                    <div className="mt-1 flex items-center gap-2">
                      <img
                        src={imagePreview || field.value}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="h-8 w-10 object-cover rounded border border-white/10"
                      />
                      <span className="text-[8px] text-emerald-400 font-mono">Image loaded</span>
                    </div>
                  )}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* ── Success Banner ── */}
        {showSuccess && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/30 p-2.5 rounded-lg text-center"
          >
            Vehicle created successfully in real database indexes!
          </motion.p>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 hover:opacity-90 font-mono font-bold py-3 text-xs text-white rounded-xl uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span>Add Donor Vehicle</span>
        </button>
      </form>
    </div>
  );
});

// ────────────────────────────────────────────────────────────
// Main Panel
// ────────────────────────────────────────────────────────────
function AdminYardPanelInner({
  vehicles,
  actionLoading,
  onUpdateStatus,
  onDelete,
  onAdd,
}: AdminYardPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value),
    []
  );

  const handleDeleteWithConfirm = useCallback(
    (vehicleId: string) => {
      if (!confirm("Are you sure you want to retire this vehicle from physical inventory?")) return;
      onDelete(vehicleId);
    },
    [onDelete]
  );

  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter((v) =>
      `${v.make} ${v.model} ${v.color} ${v.trim}`.toLowerCase().includes(term)
    );
  }, [vehicles, searchTerm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Add vehicle form */}
      <AddVehicleForm actionLoading={actionLoading} onAdd={onAdd} />

      {/* Vehicle list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3 h-3.5 w-3.5 text-slate-500" />
          <input
            id="admin-yard-search"
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Quick search yard stocks by keyword..."
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                actionLoading={actionLoading}
                onStatusChange={onUpdateStatus}
                onDelete={handleDeleteWithConfirm}
              />
            ))
          ) : (
            <div className="col-span-2 p-12 border border-white/5 bg-slate-950/20 text-center rounded-2xl text-slate-500 font-mono text-xs">
              No matching vehicles in physical stock.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const AdminYardPanel = memo(AdminYardPanelInner);
export default AdminYardPanel;