import { prisma } from '../prisma'
import type { CatalyticConverterPrice, Prisma } from '@prisma/client'

export class CatalyticConverterRepository {
  async create(data: Prisma.CatalyticConverterPriceCreateInput): Promise<CatalyticConverterPrice> {
    return prisma.catalyticConverterPrice.create({ data })
  }

  async findById(id: string): Promise<CatalyticConverterPrice | null> {
    return prisma.catalyticConverterPrice.findUnique({ where: { id } })
  }

  async findAll(): Promise<CatalyticConverterPrice[]> {
    return prisma.catalyticConverterPrice.findMany({
      orderBy: [{ active: 'desc' }, { category: 'asc' }],
    })
  }

  async findAllActive(): Promise<CatalyticConverterPrice[]> {
    return prisma.catalyticConverterPrice.findMany({
      where: { active: true },
      orderBy: { category: 'asc' },
    })
  }

  /**
   * Lookup a converter price by vehicle make/model/year.
   * Falls back to category-only entries (make/model null) if no vehicle-specific match.
   * Returns null when nothing matches.
   */
  async findByVehicle(
    make: string,
    model?: string,
    year?: number
  ): Promise<CatalyticConverterPrice | null> {
    // 1. Try exact vehicle-specific match (make + model + year in range)
    const vehicleMatch = await prisma.catalyticConverterPrice.findFirst({
      where: {
        active: true,
        make: { equals: make, mode: 'insensitive' },
        ...(model ? { model: { equals: model, mode: 'insensitive' } } : {}),
        ...(year
          ? {
              AND: [
                { OR: [{ yearFrom: null }, { yearFrom: { lte: year } }] },
                { OR: [{ yearTo: null }, { yearTo: { gte: year } }] },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (vehicleMatch) return vehicleMatch

    // 2. Fallback: make-only match
    const makeMatch = await prisma.catalyticConverterPrice.findFirst({
      where: {
        active: true,
        make: { equals: make, mode: 'insensitive' },
        model: null,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return makeMatch
  }

  async findByCategory(category: string): Promise<CatalyticConverterPrice | null> {
    return prisma.catalyticConverterPrice.findFirst({
      where: { category: { equals: category, mode: 'insensitive' }, active: true },
    })
  }

  async update(
    id: string,
    data: Prisma.CatalyticConverterPriceUpdateInput
  ): Promise<CatalyticConverterPrice> {
    return prisma.catalyticConverterPrice.update({ where: { id }, data })
  }

  async delete(id: string): Promise<CatalyticConverterPrice> {
    return prisma.catalyticConverterPrice.delete({ where: { id } })
  }
}
