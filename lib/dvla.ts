
export class DVLAError extends Error {
  statusCode?: number;
  errors?: string[];

  constructor(message: string, statusCode?: number, errors?: string[]) {
    super(message);
    this.name = 'DVLAError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export type DVLAVehicleResponse = {
  artEndDate?: string;
  co2Emissions?: number;
  colour?: string;
  dateOfLastV5CIssued?: string;
  engineCapacity?: number;
  euroStatus?: string;
  fuelType?: string;
  make?: string;
  markedForExport?: boolean;
  monthOfFirstDvlaRegistration?: string;
  monthOfFirstRegistration?: string;
  motExpiryDate?: string;
  motStatus?: string;
  realDrivingEmissions?: string;
  registrationNumber: string;
  revenueWeight?: number;
  taxDueDate?: string;
  taxStatus?: string;
  typeApproval?: string;
  wheelplan?: string;
  yearOfManufacture?: number;
};

export function estimateWeightKg(engineCapacityCc?: number, fuelType?: string): number {
  if (!engineCapacityCc) {
    return 1200; // Default weight if no engine capacity
  }

  // Basic weight estimation based on engine size and fuel type
  let baseWeight = 1000; // kg
  if (engineCapacityCc < 1000) {
    baseWeight = 900;
  } else if (engineCapacityCc < 1400) {
    baseWeight = 1050;
  } else if (engineCapacityCc < 1800) {
    baseWeight = 1200;
  } else if (engineCapacityCc < 2200) {
    baseWeight = 1350;
  } else if (engineCapacityCc < 3000) {
    baseWeight = 1500;
  } else {
    baseWeight = 1700;
  }

  // Add weight for diesel (typically heavier)
  if (fuelType?.toLowerCase().includes('diesel')) {
    baseWeight += 50;
  }

  // Add weight for electric (batteries)
  if (fuelType?.toLowerCase().includes('electric') || fuelType?.toLowerCase().includes('hybrid')) {
    baseWeight += 150;
  }

  return baseWeight;
}

export async function lookupVehicle(registration: string): Promise<DVLAVehicleResponse> {
  const apiKey = process.env.DVLA_API_KEY;
  const apiUrl = process.env.DVLA_API_URL || 'https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

  if (!apiKey) {
    throw new DVLAError('DVLA API key is not configured');
  }

  const cleanReg = registration.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registrationNumber: cleanReg,
    }),
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { errors: [response.statusText] };
    }

    const errors = errorData?.errors || [response.statusText];
    throw new DVLAError(`DVLA API request failed: ${errors.join(', ')}`, response.status, errors);
  }

  return response.json() as Promise<DVLAVehicleResponse>;
}
