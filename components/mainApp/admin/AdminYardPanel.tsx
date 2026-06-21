"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { motion } from "motion/react";
import { Search, Sliders, Trash2, Plus, RefreshCw } from "lucide-react";
import type { VehicleYard } from "@/types/types";
import type { NewVehicleFormData } from "./useAdminData";
import { INITIAL_VEHICLE_FORM } from "./useAdminData";

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
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStatusChange(vehicle.id, e.target.value);
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
          <select
            value={vehicle.status}
            onChange={handleStatusChange}
            className="bg-slate-950 text-[10px] text-slate-300 font-mono border border-white/5 px-2 py-1 rounded"
          >
            <option value="In Yard">In Yard</option>
            <option value="Dismantled">Dismantled</option>
            <option value="Scrapped">Scrapped</option>
          </select>
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
  const [formData, setFormData] = useState<NewVehicleFormData>({ ...INITIAL_VEHICLE_FORM });
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof NewVehicleFormData>(field: K, value: NewVehicleFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await onAdd(formData);
      if (success) {
        setFormData({ ...INITIAL_VEHICLE_FORM });
        setShowSuccess(true);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setShowSuccess(false), 3000);
      }
    },
    [formData, onAdd]
  );

  const isSubmitting = actionLoading === "add-vehicle";

  return (
    <div className="lg:col-span-1 bg-slate-950/45 border border-white/5 rounded-2xl p-6 h-fit space-y-5">
      <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono border-l-2 border-red-500 pl-3">
        Register Donor Vehicle
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Make *</label>
            <input
              type="text"
              required
              value={formData.make}
              onChange={(e) => updateField("make", e.target.value)}
              placeholder="e.g. BMW"
              className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Model *</label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. 5 Series"
              className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Year *</label>
            <input
              type="number"
              required
              value={formData.year}
              onChange={(e) => updateField("year", Number(e.target.value))}
              placeholder="e.g. 2008"
              className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Color *</label>
            <input
              type="text"
              required
              value={formData.color}
              onChange={(e) => updateField("color", e.target.value)}
              placeholder="e.g. Carbon Black"
              className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase">
            Trim or Engine designation *
          </label>
          <input
            type="text"
            required
            value={formData.trim}
            onChange={(e) => updateField("trim", e.target.value)}
            placeholder="e.g. 530d M-Sport (E60)"
            className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase">Arrived Date *</label>
          <input
            type="text"
            required
            value={formData.arrivedDate}
            onChange={(e) => updateField("arrivedDate", e.target.value)}
            placeholder="e.g. Jun 18, 2026"
            className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase">
            Donor Stock Image URL
          </label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => updateField("image", e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-lg px-3.5 py-2.5 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-red-500"
          />
        </div>

        {showSuccess && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/30 p-2.5 rounded-lg text-center"
          >
            Vehicle created successfully in real database indexes!
          </motion.p>
        )}

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
      `${v.make} ${v.model} ${v.color} ${v.trim}`
        .toLowerCase()
        .includes(term)
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
