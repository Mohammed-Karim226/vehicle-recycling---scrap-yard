export interface VehicleYard {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  arrivedDate: string;
  status: 'In Yard' | 'Dismantled' | 'Scrapped';
  image: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScrapMetalPrice {
  id: string;
  category: string;
  pricePerKgMin: number;
  pricePerKgMax: number;
  trend: 'Rising' | 'Stable' | 'Falling';
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalyticConverterPrice {
  id: string;
  category: string;
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  price: number;
  trend: 'Rising' | 'Stable' | 'Falling';
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Result returned by a catalytic converter lookup (by vehicle or category) */
export interface CatalyticConverterLookupResult {
  found: boolean;
  price?: number;
  category?: string;
  make?: string;
  model?: string;
  matchedBy: 'vehicle' | 'category' | 'none';
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
  createdAt?: string;
  updatedAt?: string;
  motStatus?: string;
  motExpiryDate?: string;
  mileage?: string;
  colour?: string;
  defects?: string[];
}

export interface PartQuoteSubmitted {
  requestId: string;
  vehicleId?: string;
  vehicleName: string;
  partsNeeded: string;
  name: string;
  phone: string;
  timestamp?: string;
  notes?: string;
  status: 'Pending Search' | 'Part Located' | 'Shipped' | 'No Stock' | 'Cancelled';
  createdAt?: string;
  updatedAt?: string;
}

/** Admin dashboard sub-tab identifiers */
export type AdminSubTab = 'overview' | 'scrap' | 'parts' | 'yard' | 'prices';
