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
import { lookupVehicle, estimateWeightKg, DVLAError } from '@/lib/dvla'

const scrapValuationService = new ScrapValuationService()
const scrapMetalPriceService = new ScrapMetalPriceService()

export async function generateScrapValuation(
  registration: string,
  postcode: string
): Promise<{
  id?: string
  registration: string
  postcode: string
  vehicleName: string
  estimatedValue: number
  weightKg: number
  engineSize: string
  fuelType: string
}> {
  return withActionError('generateScrapValuation', async () => {
    const parsed = quoteInputSchema.safeParse({ registration, postcode })
    if (!parsed.success) throw new ValidationError('Invalid registration or postcode')

    let vehicleData: {
      make?: string
      model?: string
      yearOfManufacture?: number
      engineCapacity?: number
      fuelType?: string
    } = {}

    try {
      // Look up vehicle from DVLA
      const dvlaData = await lookupVehicle(parsed.data.registration)
      vehicleData = dvlaData
    } catch (error) {
      // If DVLA fails, we'll use fallback values
      if (error instanceof DVLAError && error.statusCode === 404) {
        console.warn(`Vehicle not found in DVLA for registration: ${parsed.data.registration}`)
      } else {
        console.error('DVLA lookup error:', error)
      }
    }

    // Extract and format vehicle details
    const make = vehicleData.make || 'Unknown'
    const model = vehicleData.model || 'Vehicle'
    const year = vehicleData.yearOfManufacture || new Date().getFullYear()
    const engineCapacityCc = vehicleData.engineCapacity
    const fuelType = vehicleData.fuelType || 'Petrol'
    const engineSizeStr = engineCapacityCc ? `${(engineCapacityCc / 1000).toFixed(1)}L` : 'Unknown'
    const vehicleName = `${make} ${model} ${year}`

    // Calculate weight
    const weightKg = estimateWeightKg(engineCapacityCc, fuelType)

    // Get metal prices from database
    let estimatedValue = 0
    try {
      const prices = await scrapMetalPriceService.getAllPrices()
      if (prices.length > 0) {
        // Use average price per kg of available metal types
        const totalMinPrice = prices.reduce((sum, price) => sum + price.pricePerKgMin, 0)
        const totalMaxPrice = prices.reduce((sum, price) => sum + price.pricePerKgMax, 0)
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

    const valuation = await scrapValuationService.createValuation({
      registration: parsed.data.registration.toUpperCase(),
      postcode: parsed.data.postcode.toUpperCase(),
      vehicleName,
      estimatedValue,
      weightKg,
      engineSize: engineSizeStr,
      fuelType,
      status: 'Pending' as ScrapQuoteStatus,
    })

    return {
      id: valuation.id,
      registration: valuation.registration,
      postcode: valuation.postcode,
      vehicleName: valuation.vehicleName,
      estimatedValue: valuation.estimatedValue,
      weightKg: valuation.weightKg,
      engineSize: valuation.engineSize,
      fuelType: valuation.fuelType,
    }
  })
}

export async function getScrapValuationById(id: string): Promise<ScrapValuation | null> {
  return withActionError('getScrapValuationById', async () => {
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    return scrapValuationService.getValuationById(parsedId.data)
  })
}

export async function getAllScrapValuations(): Promise<ScrapValuation[]> {
  return withActionError('getAllScrapValuations', async () => {
    await requireAdmin()
    return scrapValuationService.getAllValuations()
  })
}

export async function getValuationsByIds(scrapIds: string[]): Promise<ScrapValuation[]> {
  return withActionError('getValuationsByIds', async () => {
    const parsed = uuidSchema.array().max(50).safeParse(scrapIds)
    if (!parsed.success) throw new ValidationError('Invalid valuation IDs')
    return scrapValuationService.getValuationsByIds(parsed.data)
  })
}

export async function lookupScrapValuationById(id: string): Promise<ScrapValuation | null> {
  return withActionError('lookupScrapValuationById', async () => {
    const parsedId = uuidSchema.safeParse(id.trim())
    if (!parsedId.success) return null
    return scrapValuationService.getValuationById(parsedId.data)
  })
}

export async function updateScrapValuation(
  id: string,
  data: unknown
): Promise<ScrapValuation> {
  return withActionError('updateScrapValuation', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid valuation ID')
    const parsed = scrapValuationUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid update data')
    return scrapValuationService.updateValuation(parsedId.data, parsed.data)
  })
}

export async function deleteScrapValuation(id: string): Promise<ScrapValuation> {
  return withActionError('deleteScrapValuation', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid valuation ID')
    return scrapValuationService.deleteValuation(parsedId.data)
  })
}
