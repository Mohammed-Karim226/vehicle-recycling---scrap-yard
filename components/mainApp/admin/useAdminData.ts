"use client";

import { useState, useCallback } from "react";
import type { VehicleYard, ScrapValuationResult, PartQuoteSubmitted } from "@/types/types";
import type { VehicleYard as PrismaVehicleYard, ScrapValuation as PrismaScrapValuation, PartRequest as PrismaPartRequest, VehicleStatus, ScrapQuoteStatus, PartRequestStatus } from "@prisma/client";
import { 
  getAllVehicleYards, 
  createVehicleYard, 
  updateVehicleYard, 
  deleteVehicleYard 
} from "@/lib/actions/vehicleYardActions";
import { 
  getAllScrapValuations, 
  updateScrapValuation 
} from "@/lib/actions/scrapValuationActions";
import { 
  getAllPartRequests, 
  updatePartRequest 
} from "@/lib/actions/partRequestActions";

// Helper functions to convert Prisma types to app types
function convertVehicleYard(prismaVehicle: PrismaVehicleYard): VehicleYard {
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
}

function convertScrapValuation(prismaValuation: PrismaScrapValuation): ScrapValuationResult {
  let mappedStatus = "Pending Inspection";
  if (prismaValuation.status === "Completed") {
    mappedStatus = "Collected";
  } else if (prismaValuation.status === "Rejected") {
    mappedStatus = "Cancelled";
  } else if (prismaValuation.status === "Pending") {
    mappedStatus = "Pending Inspection";
  }

  return {
    id: prismaValuation.id,
    registration: prismaValuation.registration,
    postcode: prismaValuation.postcode,
    vehicleName: prismaValuation.vehicleName,
    estimatedValue: prismaValuation.estimatedValue,
    weightKg: prismaValuation.weightKg,
    engineSize: prismaValuation.engineSize,
    fuelType: prismaValuation.fuelType,
    status: mappedStatus,
    notes: prismaValuation.notes ?? undefined
  };
}

function convertPartRequest(prismaRequest: PrismaPartRequest): PartQuoteSubmitted {
  return {
    requestId: prismaRequest.id,
    vehicleId: prismaRequest.vehicleId ?? undefined,
    vehicleName: prismaRequest.vehicleName,
    partsNeeded: prismaRequest.partsNeeded,
    name: prismaRequest.name,
    phone: prismaRequest.phone,
    status: prismaRequest.status.replace("_", " ") as PartQuoteSubmitted["status"],
    notes: prismaRequest.notes ?? undefined
  };
}

// Convert app status to Prisma status
function appToPrismaVehicleStatus(status: string): VehicleStatus {
  return status.replace(" ", "_") as VehicleStatus;
}

function appToPrismaPartRequestStatus(status: string): PartRequestStatus {
  return status.replace(" ", "_") as PartRequestStatus;
}

function appToPrismaScrapQuoteStatus(status: string): ScrapQuoteStatus {
  switch (status) {
    case "Pending Inspection":
      return "Pending";
    case "Collected":
      return "Completed";
    case "Cancelled":
      return "Rejected";
    default:
      return "Pending";
  }
}

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

  const clearError = useCallback(() => setError(null), []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [prismaVehicles, prismaValuations, prismaRequests] = await Promise.all([
        getAllVehicleYards(),
        getAllScrapValuations(),
        getAllPartRequests()
      ]);

      setVehicles(prismaVehicles.map(convertVehicleYard));
      setScrapQuotes(prismaValuations.map(convertScrapValuation));
      setPartRequests(prismaRequests.map(convertPartRequest));
    } catch (e: unknown) {
      console.error("Failed to sync dashboard:", e);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Scrap status update ──
  const handleUpdateScrapStatus = useCallback(
    async (quoteId: string, status: string, notes: string) => {
      setActionLoading(quoteId);
      try {
        const prismaStatus = appToPrismaScrapQuoteStatus(status);
        const updatedValuation = await updateScrapValuation(quoteId, { status: prismaStatus, notes });
        setScrapQuotes((prev) =>
          prev.map((q) => (q.id === quoteId ? convertScrapValuation(updatedValuation) : q))
        );
        onRefreshTrigger?.();
      } catch {
        setError("Failed to update scrap quote status.");
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
        const prismaStatus = appToPrismaPartRequestStatus(status);
        const updatedRequest = await updatePartRequest(requestId, { status: prismaStatus, notes });
        setPartRequests((prev) =>
          prev.map((p) => (p.requestId === requestId ? convertPartRequest(updatedRequest) : p))
        );
        onRefreshTrigger?.();
      } catch {
        setError("Failed to update part request status.");
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
        const prismaStatus = appToPrismaVehicleStatus(status);
        const updatedVehicle = await updateVehicleYard(vehicleId, { status: prismaStatus });
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? convertVehicleYard(updatedVehicle) : v))
        );
        onRefreshTrigger?.();
      } catch {
        setError("Failed to update vehicle status.");
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
        await deleteVehicleYard(vehicleId);
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
        onRefreshTrigger?.();
        return true;
      } catch {
        setError("Failed to delete vehicle.");
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
        const prismaStatus = appToPrismaVehicleStatus(formData.status);
        const added = await createVehicleYard({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          trim: formData.trim,
          status: prismaStatus,
          color: formData.color,
          image: formData.image
        });
        setVehicles((prev) => [convertVehicleYard(added), ...prev]);
        onRefreshTrigger?.();
        return true;
      } catch {
        setError("Failed to add vehicle.");
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
