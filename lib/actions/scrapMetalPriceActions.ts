'use server'

import { requireAdmin } from '@/lib/auth/adminSession'
import { ValidationError } from '@/lib/errors'
import { withActionError } from '@/lib/actions/safeAction'
import { ScrapMetalPriceService } from '../services/ScrapMetalPriceService'
import {
  scrapMetalPriceCreateSchema,
  scrapMetalPriceUpdateSchema,
  uuidSchema,
} from '@/lib/validation/schemas'
import type { ScrapMetalPrice } from '@prisma/client'

const scrapMetalPriceService = new ScrapMetalPriceService()

export type SerializedScrapMetalPrice = Omit<ScrapMetalPrice, 'pricePerKgMin' | 'pricePerKgMax'> & { pricePerKgMin: number; pricePerKgMax: number }
const serializePrice = (price: ScrapMetalPrice): SerializedScrapMetalPrice => ({ ...price, pricePerKgMin: Number(price.pricePerKgMin), pricePerKgMax: Number(price.pricePerKgMax) })

export async function getScrapMetalPriceById(id: string): Promise<SerializedScrapMetalPrice | null> {
  return withActionError('getScrapMetalPriceById', async () => {
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    const price = await scrapMetalPriceService.getPriceById(parsedId.data)
    return price ? serializePrice(price) : null
  })
}

export async function getAllScrapMetalPrices(): Promise<SerializedScrapMetalPrice[]> {
  return withActionError('getAllScrapMetalPrices', async () => (await scrapMetalPriceService.getAllPrices()).map(serializePrice))
}

export async function createScrapMetalPrice(data: unknown): Promise<SerializedScrapMetalPrice> {
  return withActionError('createScrapMetalPrice', async () => {
    await requireAdmin()
    const parsed = scrapMetalPriceCreateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid price data')
    return serializePrice(await scrapMetalPriceService.createPrice(parsed.data))
  })
}

export async function updateScrapMetalPrice(
  id: string,
  data: unknown
): Promise<SerializedScrapMetalPrice> {
  return withActionError('updateScrapMetalPrice', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid price ID')
    const parsed = scrapMetalPriceUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid update data')
    return serializePrice(await scrapMetalPriceService.updatePrice(parsedId.data, parsed.data))
  })
}

export async function deleteScrapMetalPrice(id: string): Promise<SerializedScrapMetalPrice> {
  return withActionError('deleteScrapMetalPrice', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid price ID')
    return serializePrice(await scrapMetalPriceService.deletePrice(parsedId.data))
  })
}
