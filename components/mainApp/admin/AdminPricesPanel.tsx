"use client";

import React, { useState, useCallback, memo } from "react";
import { Plus, Save, Trash2, RefreshCw } from "lucide-react";
import type { ScrapMetalPrice } from "@/types/types";
import { NewPriceFormData, INITIAL_PRICE_FORM } from "./useAdminData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface AdminPricesPanelProps {
  scrapMetalPrices: ScrapMetalPrice[];
  actionLoading: string | null;
  onAdd: (formData: NewPriceFormData) => Promise<boolean>;
  onUpdate: (id: string, formData: Partial<NewPriceFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

// ────────────────────────────────────────────────────────────
// Price Row Card
// ────────────────────────────────────────────────────────────
interface PriceRowCardProps {
  price: ScrapMetalPrice;
  actionLoading: string | null;
  onUpdate: (id: string, formData: Partial<NewPriceFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const PriceRowCard = memo(function PriceRowCard({
  price,
  actionLoading,
  onUpdate,
  onDelete,
}: PriceRowCardProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<NewPriceFormData>({
    category: price.category,
    pricePerKgMin: price.pricePerKgMin,
    pricePerKgMax: price.pricePerKgMax,
    trend: price.trend,
  });
  const [dirty, setDirty] = useState(false);

  const handleChange = useCallback(
    <K extends keyof NewPriceFormData>(field: K, value: NewPriceFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setDirty(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    const success = await onUpdate(price.id, formData);
    if (success) {
      setEditing(false);
      setDirty(false);
    }
  }, [price.id, formData, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (confirm(`Are you sure you want to delete the price for "${price.category}"?`)) {
      await onDelete(price.id);
    }
  }, [price.id, price.category, onDelete]);

  const isLoading =
    actionLoading === `update-price-${price.id}` || actionLoading === `del-price-${price.id}`;

  return (
    <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-4">
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
                Min Price (£/kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.pricePerKgMin}
                onChange={(e) => handleChange("pricePerKgMin", parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
                Max Price (£/kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.pricePerKgMax}
                onChange={(e) => handleChange("pricePerKgMax", parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
              Trend
            </label>
            <Select value={formData.trend} onValueChange={(v) => handleChange("trend", v as "Rising" | "Stable" | "Falling")}>
              <SelectTrigger className="w-full bg-slate-950 text-xs text-slate-300 font-mono border border-white/5 rounded-lg h-9">
                <SelectValue placeholder="Select trend" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border border-white/10 text-slate-300 font-mono text-xs shadow-xl">
                <SelectItem value="Rising">Rising</SelectItem>
                <SelectItem value="Stable">Stable</SelectItem>
                <SelectItem value="Falling">Falling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading || !dirty}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFormData({
                  category: price.category,
                  pricePerKgMin: price.pricePerKgMin,
                  pricePerKgMax: price.pricePerKgMax,
                  trend: price.trend,
                });
                setDirty(false);
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white">{price.category}</h4>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase ${
                  price.trend === "Rising"
                    ? "bg-green-900/40 text-green-400"
                    : price.trend === "Falling"
                    ? "bg-red-900/40 text-red-400"
                    : "bg-yellow-900/40 text-yellow-400"
                }`}
              >
                {price.trend}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              £{price.pricePerKgMin.toFixed(2)} - £{price.pricePerKgMax.toFixed(2)} per kg
            </p>
            {price.updatedAt && (
              <p className="text-[10px] text-slate-600 font-mono">
                Last updated: {new Date(price.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-900/40 hover:bg-red-800/40 text-red-400 font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 border border-red-900/30"
            >
              {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ────────────────────────────────────────────────────────────
// Main Panel
// ────────────────────────────────────────────────────────────
function AdminPricesPanelInner({
  scrapMetalPrices,
  actionLoading,
  onAdd,
  onUpdate,
  onDelete,
}: AdminPricesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState<NewPriceFormData>(INITIAL_PRICE_FORM);
  const [dirty, setDirty] = useState(false);

  const handleAddChange = useCallback(
    <K extends keyof NewPriceFormData>(field: K, value: NewPriceFormData[K]) => {
      setAddFormData((prev) => ({ ...prev, [field]: value }));
      setDirty(true);
    },
    []
  );

  const handleAdd = useCallback(async () => {
    const success = await onAdd(addFormData);
    if (success) {
      setShowAddForm(false);
      setAddFormData(INITIAL_PRICE_FORM);
      setDirty(false);
    }
  }, [addFormData, onAdd]);

  const isAdding = actionLoading === "add-price";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-white">Scrap Metal Prices</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-mono font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? "Cancel" : "Add New Price"}
        </button>
      </div>

      {showAddForm && (
        <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white">Add New Metal Category</h4>
          <div>
            <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
              Category
            </label>
            <input
              type="text"
              value={addFormData.category}
              onChange={(e) => handleAddChange("category", e.target.value)}
              placeholder="e.g. Steel, Aluminium, Copper"
              className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
                Min Price (£/kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={addFormData.pricePerKgMin}
                onChange={(e) => handleAddChange("pricePerKgMin", parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
                Max Price (£/kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={addFormData.pricePerKgMax}
                onChange={(e) => handleAddChange("pricePerKgMax", parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">
              Trend
            </label>
            <Select value={addFormData.trend} onValueChange={(v) => handleAddChange("trend", v as "Rising" | "Stable" | "Falling")}>
              <SelectTrigger className="w-full bg-slate-950 text-xs text-slate-300 font-mono border border-white/5 rounded-lg h-9">
                <SelectValue placeholder="Select trend" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border border-white/10 text-slate-300 font-mono text-xs shadow-xl">
                <SelectItem value="Rising">Rising</SelectItem>
                <SelectItem value="Stable">Stable</SelectItem>
                <SelectItem value="Falling">Falling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdding || !dirty}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isAdding ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Add Price Category
          </button>
        </div>
      )}

      {scrapMetalPrices.length > 0 ? (
        <div className="space-y-4">
          {scrapMetalPrices.map((price) => (
            <PriceRowCard
              key={price.id}
              price={price}
              actionLoading={actionLoading}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 border border-white/5 bg-slate-950/20 text-center rounded-2xl text-slate-500 font-mono text-xs">
          No price categories found. Add your first one above!
        </div>
      )}
    </div>
  );
}

const AdminPricesPanel = memo(AdminPricesPanelInner);
export default AdminPricesPanel;
