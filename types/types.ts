export interface VehicleYard {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  arrivedDate: string;
  status: 'In Yard' | 'Dismantled' | 'Crushed';
  image: string;
  color: string;
}

export interface ScrapMetalPrice {
  id: string;
  category: string;
  pricePerKgMin: number;
  pricePerKgMax: number;
  trend: 'Rising' | 'Stable' | 'Falling';
}

export interface ScrapQuoteRequest {
  registration: string;
  postcode: string;
}

export interface ScrapValuationResult {
  id?: string;
  registration: string;
  postcode: string;
  vehicleName: string;
  estimatedValue: number;
  weightKg: number;
  engineSize: string;
  fuelType: string;
  timestamp?: string;
  status?: string;
  notes?: string;
}

export interface PartQuoteSubmitted {
  requestId: string;
  vehicleId?: string;
  vehicleName: string;
  partsNeeded: string;
  name: string;
  phone: string;
  status: 'Pending' | 'Approved' | 'Unavailable';
}
