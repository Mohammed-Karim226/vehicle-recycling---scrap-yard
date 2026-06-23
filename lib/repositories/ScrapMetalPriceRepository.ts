import { prisma } from '../prisma'
import type { ScrapMetalPrice, Prisma } from '@prisma/client'

export class ScrapMetalPriceRepository {
  async create(data: Prisma.ScrapMetalPriceCreateInput): Promise<ScrapMetalPrice> {
    return prisma.scrapMetalPrice.create({ data })
  }

  async findById(id: string): Promise<ScrapMetalPrice | null> {
    return prisma.scrapMetalPrice.findUnique({ where: { id } })
  }

  async findAll(): Promise<ScrapMetalPrice[]> {
    return prisma.scrapMetalPrice.findMany()
  }

  async update(id: string, data: Prisma.ScrapMetalPriceUpdateInput): Promise<ScrapMetalPrice> {
    return prisma.scrapMetalPrice.update({ where: { id }, data })
  }

  async delete(id: string): Promise<ScrapMetalPrice> {
    return prisma.scrapMetalPrice.delete({ where: { id } })
  }
}
