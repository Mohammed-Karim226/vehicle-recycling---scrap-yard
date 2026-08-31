'use server'

import { requireAdmin } from '@/lib/auth/adminSession'
import { ValidationError } from '@/lib/errors'
import { withActionError } from '@/lib/actions/safeAction'
import { ScrapValuationService } from '../services/ScrapValuationService'
import { ScrapMetalPriceService } from '../services/ScrapMetalPriceService'
import {
  quoteInputSchema,
  scrapValuationUpdateSchema,
  uuidSchema,
} from '@/lib/validation/schemas'
import type { ScrapValuation, ScrapQuoteStatus } from '@prisma/client'
import { lookupVehicle, DVLAError, type DVLAVehicleResponse, estimateWeightKg } from '@/lib/dvla'
import { enforceRateLimit } from '@/lib/security/rateLimit'

const scrapValuationService = new ScrapValuationService()
const scrapMetalPriceService = new ScrapMetalPriceService()

export type AdminScrapValuation = Omit<ScrapValuation, 'estimatedValue' | 'weightKg'> & { estimatedValue: number; weightKg: number }
function toAdminScrapValuation(value: ScrapValuation): AdminScrapValuation {
  return { ...value, estimatedValue: Number(value.estimatedValue), weightKg: Number(value.weightKg) }
}

export type PublicScrapValuation = {
  trackingToken: string
  vehicleName: string
  registration: string
  estimatedValue: number
  status: ScrapValuation['status']
  notes: string | null
  createdAt: string
}

function toPublicScrapValuation(value: ScrapValuation): PublicScrapValuation {
  const record = value as ScrapValuation & { trackingToken: string }
  return {
    trackingToken: record.trackingToken,
    vehicleName: value.vehicleName,
    registration: value.registration,
    estimatedValue: Number(value.estimatedValue),
    status: value.status,
    notes: value.notes,
    createdAt: value.createdAt.toISOString(),
  }
}

export async function generateScrapValuation(
  registration: string,
  postcode: string
): Promise<{
  id?: string
  trackingToken: string
  registration: string
  postcode: string
  vehicleName: string
  estimatedValue: number
  weightKg: number
  engineSize: string
  fuelType: string
  motStatus?: string
  motExpiryDate?: string
  mileage?: string
  colour?: string
  defects?: string[]
}> {
  return withActionError('generateScrapValuation', async () => {
    const parsed = quoteInputSchema.safeParse({ registration, postcode })
    if (!parsed.success) throw new ValidationError('Invalid registration or postcode')
    await enforceRateLimit('generate-scrap-valuation', 10, 60 * 60)

    let dvlaData: DVLAVehicleResponse | null = null

    try {
      // Look up vehicle using the DVLA Vehicle Enquiry Service API
      dvlaData = await lookupVehicle(parsed.data.registration)
    } catch (error) {
      if (error instanceof DVLAError) {
        console.warn(`DVLA lookup error for registration ${parsed.data.registration}:`, error.message)
      } else {
        console.error('DVLA lookup error:', error)
      }
    }

    // Extract details or use defaults if not found (only use DVLA data now)
    const make = dvlaData?.make || 'Unknown'
    const colour = dvlaData?.colour || 'Unknown'
    const fuelType = dvlaData?.fuelType || 'Petrol'
    const engineCapacityCc = dvlaData?.engineCapacity
    const engineSizeStr = engineCapacityCc ? `${(engineCapacityCc / 1000).toFixed(1)}L` : 'Unknown'

    // Extract year of manufacture
    let year = new Date().getFullYear()
    if (dvlaData?.yearOfManufacture) {
      year = dvlaData.yearOfManufacture
    }
    
    const vehicleName = `${make} ${year}`

    // Calculate weight
    const weightKg = estimateWeightKg(engineCapacityCc, fuelType)

    // Use DVLA's MOT data if available
    let motStatus = 'Unknown'
    let motExpiryDate = ''
    if (dvlaData?.motStatus) {
      motStatus = dvlaData.motStatus
    }
    if (dvlaData?.motExpiryDate) {
      motExpiryDate = dvlaData.motExpiryDate
    }

    // Get metal prices from database
    let estimatedValue = 0
    try {
      const prices = await scrapMetalPriceService.getAllPrices()
      if (prices.length > 0) {
        // Use average price per kg of available metal types
        const totalMinPrice = prices.reduce((sum, price) => sum + Number(price.pricePerKgMin), 0)
        const totalMaxPrice = prices.reduce((sum, price) => sum + Number(price.pricePerKgMax), 0)
        const avgPricePerKg = (totalMinPrice + totalMaxPrice) / (2 * prices.length)
        estimatedValue = Math.round(weightKg * avgPricePerKg)
      } else {
        // Fallback to default price if no metal prices in DB
        estimatedValue = Math.round(weightKg * 0.3) // £0.30/kg default
      }
    } catch {
      // If price lookup fails, use fallback
      estimatedValue = Math.round(weightKg * 0.3)
    }

    // Ensure minimum value of £50
    if (estimatedValue < 50) estimatedValue = 50

    // Construct notes from DVLA data
    const notesLines = [
      `MOT Status: ${motStatus}`,
      motExpiryDate ? `MOT Expiry: ${motExpiryDate}` : null,
      colour ? `Colour: ${colour}` : null,
    ].filter(Boolean) as string[]
    const notesStr = notesLines.join('\n')

    const valuation = await scrapValuationService.createValuation({
      registration: parsed.data.registration.toUpperCase(),
      postcode: parsed.data.postcode.toUpperCase(),
      vehicleName,
      estimatedValue,
      weightKg,
      engineSize: engineSizeStr,
      fuelType,
      status: 'Pending' as ScrapQuoteStatus,
      notes: notesStr,
    })

    return {
      id: valuation.id,
      trackingToken: (valuation as ScrapValuation & { trackingToken: string }).trackingToken,
      registration: valuation.registration,
      postcode: valuation.postcode,
      vehicleName: valuation.vehicleName,
      estimatedValue: Number(valuation.estimatedValue),
      weightKg: Number(valuation.weightKg),
      engineSize: valuation.engineSize,
      fuelType: valuation.fuelType,
      motStatus,
      motExpiryDate,
      mileage: '',
      colour,
      defects: [],
    }
  })
}

export async function getScrapValuationById(id: string): Promise<AdminScrapValuation | null> {
  return withActionError('getScrapValuationById', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    const value = await scrapValuationService.getValuationById(parsedId.data)
    return value ? toAdminScrapValuation(value) : null
  })
}

export async function getAllScrapValuations(): Promise<AdminScrapValuation[]> {
  return withActionError('getAllScrapValuations', async () => {
    await requireAdmin()
    return (await scrapValuationService.getAllValuations()).map(toAdminScrapValuation)
  })
}

export async function getValuationsByIds(scrapIds: string[]): Promise<PublicScrapValuation[]> {
  return withActionError('getValuationsByIds', async () => {
    const parsed = uuidSchema.array().max(50).safeParse(scrapIds)
    if (!parsed.success) throw new ValidationError('Invalid valuation IDs')
    if (parsed.data.length === 0) return []
    await enforceRateLimit('batch-scrap-valuations', 60, 60 * 60)
    const rows = await scrapValuationService.getValuationsByTrackingTokens(parsed.data)
    return rows.map(toPublicScrapValuation)
  })
}

export async function lookupScrapValuationById(id: string): Promise<PublicScrapValuation | null> {
  return withActionError('lookupScrapValuationById', async () => {
    await enforceRateLimit('lookup-scrap-valuation', 30, 60 * 60)
    const parsedId = uuidSchema.safeParse(id.trim())
    if (!parsedId.success) return null
    const rows = await scrapValuationService.getValuationsByTrackingTokens([parsedId.data])
    return rows[0] ? toPublicScrapValuation(rows[0]) : null
  })
}

export async function updateScrapValuation(
  id: string,
  data: unknown
): Promise<AdminScrapValuation> {
  return withActionError('updateScrapValuation', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid valuation ID')
    const parsed = scrapValuationUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid update data')
    return toAdminScrapValuation(await scrapValuationService.updateValuation(parsedId.data, parsed.data))
  })
}

export async function deleteScrapValuation(id: string): Promise<AdminScrapValuation> {
  return withActionError('deleteScrapValuation', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid valuation ID')
    return toAdminScrapValuation(await scrapValuationService.deleteValuation(parsedId.data))
  })
}
