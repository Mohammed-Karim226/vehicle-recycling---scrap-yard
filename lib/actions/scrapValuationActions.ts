'use server'

import { ScrapValuationService } from '../services/ScrapValuationService'
import type { ScrapValuation, Prisma, ScrapQuoteStatus } from '@prisma/client'

const scrapValuationService = new ScrapValuationService()

// Mock valuation generator
export async function generateScrapValuation(registration: string, postcode: string): Promise<{
  id?: string;
  registration: string;
  postcode: string;
  vehicleName: string;
  estimatedValue: number;
  weightKg: number;
  engineSize: string;
  fuelType: string;
}> {
  // Mock vehicle data based on registration
  const mockVehicles = [
    { vehicleName: "Ford Focus 1.6 Zetec", engineSize: "1.6L", fuelType: "Petrol", weightKg: 1250, value: 350 },
    { vehicleName: "Vauxhall Astra 1.7 CDTi", engineSize: "1.7L", fuelType: "Diesel", weightKg: 1320, value: 420 },
    { vehicleName: "Volkswagen Golf 2.0 TDI", engineSize: "2.0L", fuelType: "Diesel", weightKg: 1380, value: 480 },
    { vehicleName: "BMW 3 Series 320d", engineSize: "2.0L", fuelType: "Diesel", weightKg: 1490, value: 550 },
    { vehicleName: "Toyota Yaris 1.3 VVT-i", engineSize: "1.3L", fuelType: "Petrol", weightKg: 1050, value: 280 },
  ];
  
  const randomVehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)];
  
  const valuation = await createScrapValuation({
    registration,
    postcode,
    vehicleName: randomVehicle.vehicleName,
    estimatedValue: randomVehicle.value,
    weightKg: randomVehicle.weightKg,
    engineSize: randomVehicle.engineSize,
    fuelType: randomVehicle.fuelType,
    status: "Pending" as ScrapQuoteStatus
  });

  return {
    id: valuation.id,
    registration: valuation.registration,
    postcode: valuation.postcode,
    vehicleName: valuation.vehicleName,
    estimatedValue: valuation.estimatedValue,
    weightKg: valuation.weightKg,
    engineSize: valuation.engineSize,
    fuelType: valuation.fuelType
  };
}

export async function createScrapValuation(data: Prisma.ScrapValuationCreateInput): Promise<ScrapValuation> {
  return scrapValuationService.createValuation(data)
}

export async function getScrapValuationById(id: string): Promise<ScrapValuation | null> {
  return scrapValuationService.getValuationById(id)
}

export async function getAllScrapValuations(): Promise<ScrapValuation[]> {
  return scrapValuationService.getAllValuations()
}

export async function updateScrapValuation(id: string, data: Prisma.ScrapValuationUpdateInput): Promise<ScrapValuation> {
  return scrapValuationService.updateValuation(id, data)
}

export async function deleteScrapValuation(id: string): Promise<ScrapValuation> {
  return scrapValuationService.deleteValuation(id)
}
