import { CatalyticConverterRepository } from '../repositories/CatalyticConverterRepository'
import type { CatalyticConverterPrice, Prisma } from '@prisma/client'
import type { CatalyticConverterLookupResult } from '@/types/types'

export class CatalyticConverterService {
  private repository: CatalyticConverterRepository

  constructor() {
    this.repository = new CatalyticConverterRepository()
  }

  async createPrice(
    data: Prisma.CatalyticConverterPriceCreateInput
  ): Promise<CatalyticConverterPrice> {
    return this.repository.create(data)
  }

  async getPriceById(id: string): Promise<CatalyticConverterPrice | null> {
    return this.repository.findById(id)
  }

  async getAllPrices(): Promise<CatalyticConverterPrice[]> {
    return this.repository.findAll()
  }

  async getAllActivePrices(): Promise<CatalyticConverterPrice[]> {
    return this.repository.findAllActive()
  }

  async updatePrice(
    id: string,
    data: Prisma.CatalyticConverterPriceUpdateInput
  ): Promise<CatalyticConverterPrice> {
    return this.repository.update(id, data)
  }

  async deletePrice(id: string): Promise<CatalyticConverterPrice> {
    return this.repository.delete(id)
  }

  /**
   * Lookup a converter price for a vehicle.
   * Priority: vehicle-specific (make+model+year) → make-only → none.
   */
  async lookupByVehicle(
    make: string,
    model?: string,
    year?: number
  ): Promise<CatalyticConverterLookupResult> {
    const match = await this.repository.findByVehicle(make, model, year)

    if (!match) {
      return { found: false, matchedBy: 'none' }
    }

    const isVehicleSpecific = Boolean(match.make)
    return {
      found: true,
      price: match.price,
      category: match.category,
      make: match.make ?? undefined,
      model: match.model ?? undefined,
      matchedBy: isVehicleSpecific ? 'vehicle' : 'category',
    }
  }

  /**
   * Lookup by category name only (e.g. "Small Foreign").
   */
  async lookupByCategory(category: string): Promise<CatalyticConverterLookupResult> {
    const match = await this.repository.findByCategory(category)

    if (!match) {
      return { found: false, matchedBy: 'none' }
    }

    return {
      found: true,
      price: match.price,
      category: match.category,
      make: match.make ?? undefined,
      model: match.model ?? undefined,
      matchedBy: 'category',
    }
  }
}
