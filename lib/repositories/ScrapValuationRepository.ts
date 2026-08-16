import { prisma } from '../prisma'
import type { ScrapValuation, Prisma } from '@prisma/client'

export class ScrapValuationRepository {
  async create(data: Prisma.ScrapValuationCreateInput): Promise<ScrapValuation> {
    return prisma.scrapValuation.create({ data })
  }

  async findById(id: string): Promise<ScrapValuation | null> {
    return prisma.scrapValuation.findUnique({ where: { id } })
  }

  async findByIds(ids: string[]): Promise<ScrapValuation[]> {
    if (ids.length === 0) return []
    return prisma.scrapValuation.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByTrackingTokens(tokens: string[]): Promise<ScrapValuation[]> {
    if (tokens.length === 0) return []
    return prisma.scrapValuation.findMany({
      where: { trackingToken: { in: tokens } } as never,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
    })
  }

  async countAll(): Promise<number> {
    return prisma.scrapValuation.count()
  }

  async findAll(): Promise<ScrapValuation[]> {
    return prisma.scrapValuation.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }

  async update(id: string, data: Prisma.ScrapValuationUpdateInput): Promise<ScrapValuation> {
    return prisma.scrapValuation.update({ where: { id }, data })
  }

  async delete(id: string): Promise<ScrapValuation> {
    return prisma.scrapValuation.delete({ where: { id } })
  }
}
