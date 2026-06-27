'use server'

import { requireAdmin } from '@/lib/auth/adminSession'
import { ValidationError } from '@/lib/errors'
import { withActionError } from '@/lib/actions/safeAction'
import { ScrapValuationService } from '../services/ScrapValuationService'
import {
  quoteInputSchema,
  scrapValuationUpdateSchema,
  uuidSchema,
} from '@/lib/validation/schemas'
import type { ScrapValuation, ScrapQuoteStatus } from '@prisma/client'

const scrapValuationService = new ScrapValuationService()

const mockVehicles = [
  { vehicleName: 'Ford Focus 1.6 Zetec', engineSize: '1.6L', fuelType: 'Petrol', weightKg: 1250, value: 350 },
  { vehicleName: 'Vauxhall Astra 1.7 CDTi', engineSize: '1.7L', fuelType: 'Diesel', weightKg: 1320, value: 420 },
  { vehicleName: 'Volkswagen Golf 2.0 TDI', engineSize: '2.0L', fuelType: 'Diesel', weightKg: 1380, value: 480 },
  { vehicleName: 'BMW 3 Series 320d', engineSize: '2.0L', fuelType: 'Diesel', weightKg: 1490, value: 550 },
  { vehicleName: 'Toyota Yaris 1.3 VVT-i', engineSize: '1.3L', fuelType: 'Petrol', weightKg: 1050, value: 280 },
]

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

    const randomVehicle = mockVehicles[Math.floor(Math.random() * mockVehicles.length)]

    const valuation = await scrapValuationService.createValuation({
      registration: parsed.data.registration.toUpperCase(),
      postcode: parsed.data.postcode.toUpperCase(),
      vehicleName: randomVehicle.vehicleName,
      estimatedValue: randomVehicle.value,
      weightKg: randomVehicle.weightKg,
      engineSize: randomVehicle.engineSize,
      fuelType: randomVehicle.fuelType,
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
