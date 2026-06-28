
export interface DVLAVehicleResponse {
  registrationNumber: string
  taxStatus?: string
  taxDueDate?: string
  artEndDate?: string
  motStatus?: string
  motExpiryDate?: string
  make?: string
  monthOfFirstRegistration?: string
  yearOfManufacture?: number
  engineCapacity?: number
  co2Emissions?: number
  fuelType?: string
  markedForExport?: boolean
  colour?: string
  typeApproval?: string
  wheelplan?: string
  revenueWeight?: number
  realDrivingEmissions?: string
  dateOfLastV5CIssued?: string
  euroStatus?: string
}

export class DVLAError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'DVLAError'
  }
}

export async function lookupVehicle(registration: string): Promise<DVLAVehicleResponse> {
  const apiKey = process.env.DVLA_API_KEY
  if (!apiKey) {
    throw new DVLAError('DVLA API key not configured', 500)
  }

  const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationNumber: registration.replace(/\s/g, '').toUpperCase() }),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new DVLAError('Vehicle not found', 404)
    }
    if (response.status === 400) {
      throw new DVLAError('Invalid registration number', 400)
    }
    const errorText = await response.text()
    console.error('DVLA API error:', response.status, errorText)
    throw new DVLAError('Failed to look up vehicle', response.status)
  }

  const data = await response.json()
  return data
}

export function estimateWeightKg(engineCapacityCc: number | undefined, fuelType: string | undefined): number {
  // Estimate vehicle weight based on engine capacity and fuel type
  // This is a simplified model - in production you'd use a more robust dataset
  let baseWeight = 1000 // kg (base weight for small car)

  if (engineCapacityCc) {
    // Add weight based on engine size
    // 1000cc = ~1000kg, 2000cc = ~1500kg, 3000cc = ~2000kg
    baseWeight += (engineCapacityCc / 1000) * 500
  }

  if (fuelType?.toLowerCase() === 'diesel') {
    // Diesel engines are slightly heavier
    baseWeight += 100
  }

  // Cap between reasonable bounds
  return Math.max(800, Math.min(3000, Math.round(baseWeight)))
}
