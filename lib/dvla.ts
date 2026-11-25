import "server-only";
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';

export const DVLA_PRODUCTION_API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
export const DVLA_UAT_API_URL = 'https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

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

const vehicleResponseSchema = z.object({
  artEndDate: z.string().trim().optional(),
  automatedVehicle: z.boolean().optional(),
  co2Emissions: z.number().nonnegative().optional(),
  colour: z.string().trim().optional(),
  dateOfLastV5CIssued: z.string().trim().optional(),
  engineCapacity: z.number().nonnegative().optional(),
  euroStatus: z.string().trim().optional(),
  fuelType: z.string().trim().optional(),
  make: z.string().trim().optional(),
  markedAsScrapped: z.boolean().optional(),
  markedForExport: z.boolean().optional(),
  monthOfFirstDvlaRegistration: z.string().trim().optional(),
  // The current API uses a month number; older UAT fixtures use YYYY-MM.
  monthOfFirstRegistration: z.union([z.number().int().min(1).max(12), z.string().trim()]).optional(),
  monthOfFirstRegistrationWithDVLA: z.number().int().min(1).max(12).optional(),
  motExpiry: z.string().trim().optional(),
  motExpiryDate: z.string().trim().optional(),
  motStatus: z.string().trim().optional(),
  realDrivingEmissions: z.string().trim().optional(),
  registrationNumber: z.string().trim().min(1),
  revenueWeight: z.number().nonnegative().optional(),
  taxDueDate: z.string().trim().optional(),
  taxStatus: z.string().trim().optional(),
  typeApproval: z.string().trim().optional(),
  vehicleStatus: z.string().trim().optional(),
  wheelPlan: z.string().trim().optional(),
  wheelplan: z.string().trim().optional(),
  yearOfFirstRegistration: z.number().int().optional(),
  yearOfFirstRegistrationWithDVLA: z.number().int().optional(),
  yearOfManufacture: z.number().int().optional(),
});

export type DVLAVehicleResponse = z.infer<typeof vehicleResponseSchema>;

function retryDelayMs(retryAfter: string | null): number {
  if (!retryAfter?.trim()) return 1_000;
  const value = retryAfter.trim();
  if (/^\d+$/.test(value)) return Math.max(1_000, Number(value) * 1_000);
  const retryAt = Date.parse(value);
  return Number.isFinite(retryAt) ? Math.max(1_000, retryAt - Date.now()) : 1_000;
}

function getErrorMessages(data: unknown, fallback: string): string[] {
  if (typeof data === 'string' && data.trim()) return [data.trim()];
  if (Array.isArray(data)) {
    const messages = data.flatMap((item) => getErrorMessages(item, ''));
    return messages.length ? messages : [fallback];
  }
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.errors)) return getErrorMessages(record.errors, fallback);
    const messages = [record.title, record.detail, record.message]
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      .map((value) => value.trim());
    if (messages.length) return messages;
  }
  return fallback ? [fallback] : [];
}

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
  const apiKey = process.env.DVLA_API_KEY?.trim();
  const apiUrl = process.env.DVLA_API_URL?.trim() || DVLA_PRODUCTION_API_URL;

  if (!apiKey) {
    throw new DVLAError('DVLA API key is not configured');
  }

  // Only send credentials to DVLA's documented HTTPS endpoints.
  if (apiUrl !== DVLA_PRODUCTION_API_URL && apiUrl !== DVLA_UAT_API_URL) {
    throw new DVLAError('DVLA_API_URL must use the official production or UAT endpoint');
  }

  const cleanReg = registration.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(cleanReg)) {
    throw new DVLAError('Invalid vehicle registration', 400);
  }

  try {
    // Share one deadline across both attempts, response bodies and the retry wait.
    const signal = AbortSignal.timeout(8_000);
    const request = () => fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ registrationNumber: cleanReg }),
      signal,
      cache: 'no-store',
      redirect: 'error',
    });

    let response = await request();
    if (response.status === 429) {
      const retryMs = retryDelayMs(response.headers.get('retry-after'));
      if (retryMs <= 2_000) {
        await response.body?.cancel();
        await delay(retryMs, undefined, { signal });
        signal.throwIfAborted();
        response = await request();
      }
    }

    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      signal.throwIfAborted();
      if (response.ok) throw new DVLAError('DVLA returned invalid JSON', 502);
    }

    if (!response.ok) {
      const errors = getErrorMessages(responseData, response.statusText || `HTTP ${response.status}`);
      throw new DVLAError(`DVLA API request failed: ${errors.join(', ')}`, response.status, errors);
    }

    const parsed = vehicleResponseSchema.safeParse(responseData);
    if (!parsed.success || parsed.data.registrationNumber.replace(/\s/g, '').toUpperCase() !== cleanReg) {
      throw new DVLAError('DVLA returned an invalid vehicle response', 502);
    }

    // Preserve the existing application fields across current and legacy VES responses.
    return {
      ...parsed.data,
      registrationNumber: cleanReg,
      motExpiryDate: parsed.data.motExpiry || parsed.data.motExpiryDate,
      wheelplan: parsed.data.wheelPlan || parsed.data.wheelplan,
    };
  } catch (error) {
    if (error instanceof DVLAError) throw error;
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new DVLAError(timedOut ? 'DVLA request timed out' : 'DVLA could not be reached', timedOut ? 504 : 503);
  }
}
