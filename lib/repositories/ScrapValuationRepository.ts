import { prisma } from '../prisma'
import type { ScrapValuation, Prisma } from '@prisma/client'

export class ScrapValuationRepository {
  async create(data: Prisma.ScrapValuationCreateInput): Promise<ScrapValuation> {
    return prisma.scrapValuation.create({ data })
  }

  async findById(id: string): Promise<ScrapValuation | null> {
    return prisma.scrapValuation.findUnique({ where: { id } })
  }

  async findAll(): Promise<ScrapValuation[]> {
    return prisma.scrapValuation.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  async update(id: string, data: Prisma.ScrapValuationUpdateInput): Promise<ScrapValuation> {
    return prisma.scrapValuation.update({ where: { id }, data })
  }

  async delete(id: string): Promise<ScrapValuation> {
    return prisma.scrapValuation.delete({ where: { id } })
  }
}
