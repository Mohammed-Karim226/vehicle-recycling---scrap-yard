"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { VehicleYard, ScrapValuationResult, PartQuoteSubmitted } from "@/types/types";

// ────────────────────────────────────────────────────────────
// New vehicle form shape
// ────────────────────────────────────────────────────────────
export interface NewVehicleFormData {
  make: string;
  model: string;
  year: number;
  trim: string;
  arrivedDate: string;
  status: "In Yard";
  color: string;
  image: string;
}

export const INITIAL_VEHICLE_FORM: NewVehicleFormData = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  trim: "",
  arrivedDate: new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }),
  status: "In Yard" as const,
  color: "",
  image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop",
};

// ────────────────────────────────────────────────────────────
// Hook return type
// ────────────────────────────────────────────────────────────
export interface UseAdminDataReturn {
  // Data
  vehicles: VehicleYard[];
  scrapQuotes: ScrapValuationResult[];
  partRequests: PartQuoteSubmitted[];

  // State
  loading: boolean;
  actionLoading: string | null;
  error: string | null;

  // Actions
  fetchAllData: () => Promise<void>;
  handleUpdateScrapStatus: (quoteId: string, status: string, notes: string) => Promise<void>;
  handleUpdatePartStatus: (requestId: string, status: string, notes: string) => Promise<void>;
  handleUpdateYardStatus: (vehicleId: string, status: string) => Promise<void>;
  handleDeleteYardVehicle: (vehicleId: string) => Promise<boolean>;
  handleAddYardVehicle: (formData: NewVehicleFormData) => Promise<boolean>;
  clearError: () => void;
}

// ────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────
export function useAdminData(onRefreshTrigger?: () => void): UseAdminDataReturn {
  const [vehicles, setVehicles] = useState<VehicleYard[]>([]);
  const [scrapQuotes, setScrapQuotes] = useState<ScrapValuationResult[]>([]);
  const [partRequests, setPartRequests] = useState<PartQuoteSubmitted[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fetchAllData = useCallback(async () => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [vRes, sRes, pRes] = await Promise.all([
        fetch("/api/vehicles", { signal: controller.signal }),
        fetch("/api/scrap-quotes", { signal: controller.signal }),
        fetch("/api/part-requests", { signal: controller.signal }),
      ]);

      if (vRes.ok) setVehicles(await vRes.json());
      else setError("Failed to load vehicles.");

      if (sRes.ok) setScrapQuotes(await sRes.json());
      else setError((prev) => (prev ? `${prev} ` : "") + "Failed to load scrap quotes.");

      if (pRes.ok) setPartRequests(await pRes.json());
      else setError((prev) => (prev ? `${prev} ` : "") + "Failed to load part requests.");
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error("Failed to sync dashboard:", e);
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Scrap status update ──
  const handleUpdateScrapStatus = useCallback(
    async (quoteId: string, status: string, notes: string) => {
      setActionLoading(quoteId);
      try {
        const res = await fetch(`/api/scrap-quotes/${quoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes }),
        });
        if (res.ok) {
          setScrapQuotes((prev) =>
            prev.map((q) => (q.id === quoteId ? { ...q, status, notes } : q))
          );
          onRefreshTrigger?.();
        } else {
          setError("Failed to update scrap quote status.");
        }
      } catch {
        setError("Network error updating scrap quote.");
      } finally {
        setActionLoading(null);
      }
    },
    [onRefreshTrigger]
  );

  // ── Part status update ──
  const handleUpdatePartStatus = useCallback(
    async (requestId: string, status: string, notes: string) => {
      setActionLoading(requestId);
      try {
        const res = await fetch(`/api/part-requests/${requestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes }),
        });
        if (res.ok) {
          setPartRequests((prev) =>
            prev.map((p) => (p.requestId === requestId ? { ...p, status: status as PartQuoteSubmitted["status"], notes } : p))
          );
          onRefreshTrigger?.();
        } else {
          setError("Failed to update part request status.");
        }
      } catch {
        setError("Network error updating part request.");
      } finally {
        setActionLoading(null);
      }
    },
    [onRefreshTrigger]
  );

  // ── Yard status update ──
  const handleUpdateYardStatus = useCallback(
    async (vehicleId: string, status: string) => {
      setActionLoading(vehicleId);
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setVehicles((prev) =>
            prev.map((v) => (v.id === vehicleId ? { ...v, status: status as VehicleYard["status"] } : v))
          );
          onRefreshTrigger?.();
        } else {
          setError("Failed to update vehicle status.");
        }
      } catch {
        setError("Network error updating vehicle.");
      } finally {
        setActionLoading(null);
      }
    },
    [onRefreshTrigger]
  );

  // ── Delete yard vehicle ──
  const handleDeleteYardVehicle = useCallback(
    async (vehicleId: string): Promise<boolean> => {
      setActionLoading(`del-${vehicleId}`);
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
          onRefreshTrigger?.();
          return true;
        }
        setError("Failed to delete vehicle.");
        return false;
      } catch {
        setError("Network error deleting vehicle.");
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [onRefreshTrigger]
  );

  // ── Add yard vehicle ──
  const handleAddYardVehicle = useCallback(
    async (formData: NewVehicleFormData): Promise<boolean> => {
      setActionLoading("add-vehicle");
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const added: VehicleYard = await res.json();
          setVehicles((prev) => [added, ...prev]);
          onRefreshTrigger?.();
          return true;
        }
        setError("Failed to add vehicle.");
        return false;
      } catch {
        setError("Network error adding vehicle.");
        return false;
      } finally {
        setActionLoading(null);
      }
    },
    [onRefreshTrigger]
  );

  return {
    vehicles,
    scrapQuotes,
    partRequests,
    loading,
    actionLoading,
    error,
    fetchAllData,
    handleUpdateScrapStatus,
    handleUpdatePartStatus,
    handleUpdateYardStatus,
    handleDeleteYardVehicle,
    handleAddYardVehicle,
    clearError,
  };
}
