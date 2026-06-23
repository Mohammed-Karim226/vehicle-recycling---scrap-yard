import { ScrapMetalPriceRepository } from '../repositories/ScrapMetalPriceRepository'
import type { ScrapMetalPrice, Prisma } from '@prisma/client'

export class ScrapMetalPriceService {
  private repository: ScrapMetalPriceRepository

  constructor() {
    this.repository = new ScrapMetalPriceRepository()
  }

  async createPrice(data: Prisma.ScrapMetalPriceCreateInput): Promise<ScrapMetalPrice> {
    return this.repository.create(data)
  }

  async getPriceById(id: string): Promise<ScrapMetalPrice | null> {
    return this.repository.findById(id)
  }

  async getAllPrices(): Promise<ScrapMetalPrice[]> {
    return this.repository.findAll()
  }

  async updatePrice(id: string, data: Prisma.ScrapMetalPriceUpdateInput): Promise<ScrapMetalPrice> {
    return this.repository.update(id, data)
  }

  async deletePrice(id: string): Promise<ScrapMetalPrice> {
    return this.repository.delete(id)
  }
}
