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
import { lookupMOTVehicle, estimateWeightKg, MOTError, type MOTVehicleResponse, type MOTTestDefect } from '@/lib/mot'
import { lookupVehicle, DVLAError, type DVLAVehicleResponse } from '@/lib/dvla'

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
  motStatus?: string
  motExpiryDate?: string
  mileage?: string
  colour?: string
  defects?: string[]
}> {
  return withActionError('generateScrapValuation', async () => {
    const parsed = quoteInputSchema.safeParse({ registration, postcode })
    if (!parsed.success) throw new ValidationError('Invalid registration or postcode')

    let motData: MOTVehicleResponse | null = null
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

    try {
      // Look up vehicle using the MOT History API
      motData = await lookupMOTVehicle(parsed.data.registration)
    } catch (error) {
      if (error instanceof MOTError && error.statusCode === 404) {
        console.warn(`Vehicle not found in MOT records for registration: ${parsed.data.registration}`)
      } else {
        console.error('MOT lookup error:', error)
      }
    }

    // Extract details or use defaults if not found (prioritize DVLA data, fall back to MOT, then defaults)
    const make = dvlaData?.make || motData?.make || 'Unknown'
    const model = motData?.model || 'Vehicle' // DVLA doesn't provide model, use MOT or default
    const colour = dvlaData?.colour || motData?.primaryColour || 'Unknown'
    const fuelType = dvlaData?.fuelType || motData?.fuelType || 'Petrol'
    const engineCapacityCc = dvlaData?.engineCapacity || (motData?.engineSize ? parseInt(motData.engineSize, 10) : undefined)
    const engineSizeStr = engineCapacityCc ? `${(engineCapacityCc / 1000).toFixed(1)}L` : 'Unknown'

    // Extract year of manufacture from manufactureDate or firstUsedDate
    let year = new Date().getFullYear()
    if (dvlaData?.yearOfManufacture) {
      year = dvlaData.yearOfManufacture
    } else if (motData?.manufactureDate) {
      const parsedYear = parseInt(motData.manufactureDate.split('-')[0], 10)
      if (!isNaN(parsedYear)) year = parsedYear
    } else if (motData?.firstUsedDate) {
      const parsedYear = parseInt(motData.firstUsedDate.split('-')[0], 10)
      if (!isNaN(parsedYear)) year = parsedYear
    }
    
    const vehicleName = `${make} ${model} ${year}`

    // Calculate weight using the new helper
    const weightKg = estimateWeightKg(engineCapacityCc, fuelType)

    // Parse MOT Status, Expiry, Mileage and Defects
    let motStatus = 'Unknown'
    let motExpiryDate = ''
    let mileage = ''
    const defects: string[] = []

    if (motData?.motTests && motData.motTests.length > 0) {
      const latestTest = motData.motTests[0]
      const today = new Date()
      
      if (latestTest.testResult === 'PASSED') {
        if (latestTest.expiryDate) {
          const expiry = new Date(latestTest.expiryDate)
          if (expiry >= today) {
            motStatus = 'Active'
          } else {
            motStatus = 'Expired'
          }
          motExpiryDate = latestTest.expiryDate
        } else {
          motStatus = 'Active'
        }
      } else if (latestTest.testResult === 'FAILED') {
        motStatus = 'Failed'
        if (latestTest.expiryDate) {
          motExpiryDate = latestTest.expiryDate
        }
      }

      if (latestTest.odometerValue) {
        mileage = `${latestTest.odometerValue} ${latestTest.odometerUnit || 'mi'}`
      }

      if (latestTest.defects && latestTest.defects.length > 0) {
        latestTest.defects.forEach((defect: MOTTestDefect) => {
          if (defect.text) {
            defects.push(`${defect.type || 'ADVISORY'}: ${defect.text}`)
          }
        })
      }
    } else if (motData) {
      motStatus = 'No History'
    }

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

    // Construct a rich notes report from MOT specifications to save in DB for admins
    const notesLines = [
      `MOT Status: ${motStatus}`,
      motExpiryDate ? `MOT Expiry: ${motExpiryDate}` : null,
      mileage ? `Latest Odometer: ${mileage}` : null,
      colour ? `Colour: ${colour}` : null,
    ].filter(Boolean) as string[]

    if (defects.length > 0) {
      notesLines.push('Recent Defects/Advisories:')
      defects.forEach(d => notesLines.push(`- ${d}`))
    }
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
      registration: valuation.registration,
      postcode: valuation.postcode,
      vehicleName: valuation.vehicleName,
      estimatedValue: valuation.estimatedValue,
      weightKg: valuation.weightKg,
      engineSize: valuation.engineSize,
      fuelType: valuation.fuelType,
      motStatus,
      motExpiryDate,
      mileage,
      colour,
      defects,
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
