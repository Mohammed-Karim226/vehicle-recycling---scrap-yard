'use server'

import { ScrapMetalPriceService } from '../services/ScrapMetalPriceService'
import type { ScrapMetalPrice, Prisma } from '@prisma/client'

const scrapMetalPriceService = new ScrapMetalPriceService()

export async function createScrapMetalPrice(data: Prisma.ScrapMetalPriceCreateInput): Promise<ScrapMetalPrice> {
  return scrapMetalPriceService.createPrice(data)
}

export async function getScrapMetalPriceById(id: string): Promise<ScrapMetalPrice | null> {
  return scrapMetalPriceService.getPriceById(id)
}

export async function getAllScrapMetalPrices(): Promise<ScrapMetalPrice[]> {
  return scrapMetalPriceService.getAllPrices()
}

export async function updateScrapMetalPrice(id: string, data: Prisma.ScrapMetalPriceUpdateInput): Promise<ScrapMetalPrice> {
  return scrapMetalPriceService.updatePrice(id, data)
}

export async function deleteScrapMetalPrice(id: string): Promise<ScrapMetalPrice> {
  return scrapMetalPriceService.deletePrice(id)
}
