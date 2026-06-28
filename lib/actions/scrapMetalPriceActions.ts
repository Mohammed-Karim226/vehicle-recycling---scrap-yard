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

export async function getScrapMetalPriceById(id: string): Promise<ScrapMetalPrice | null> {
  return withActionError('getScrapMetalPriceById', async () => {
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    return scrapMetalPriceService.getPriceById(parsedId.data)
  })
}

export async function getAllScrapMetalPrices(): Promise<ScrapMetalPrice[]> {
  return withActionError('getAllScrapMetalPrices', () => scrapMetalPriceService.getAllPrices())
}

export async function createScrapMetalPrice(data: unknown): Promise<ScrapMetalPrice> {
  return withActionError('createScrapMetalPrice', async () => {
    await requireAdmin()
    const parsed = scrapMetalPriceCreateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid price data')
    return scrapMetalPriceService.createPrice(parsed.data)
  })
}

export async function updateScrapMetalPrice(
  id: string,
  data: unknown
): Promise<ScrapMetalPrice> {
  return withActionError('updateScrapMetalPrice', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid price ID')
    const parsed = scrapMetalPriceUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid update data')
    return scrapMetalPriceService.updatePrice(parsedId.data, parsed.data)
  })
}

export async function deleteScrapMetalPrice(id: string): Promise<ScrapMetalPrice> {
  return withActionError('deleteScrapMetalPrice', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid price ID')
    return scrapMetalPriceService.deletePrice(parsedId.data)
  })
}
