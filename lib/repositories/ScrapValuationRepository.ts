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

  async countAll(): Promise<number> {
    return prisma.scrapValuation.count()
  }

  async findAll(): Promise<ScrapValuation[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    try {
      await prisma.scrapValuation.deleteMany({
        where: {
          status: 'Rejected',
          updatedAt: {
            lt: threeDaysAgo
          }
        }
      });
    } catch (err) {
      console.error("Error doing auto-cleanup of scrap valuations:", err);
    }

    return prisma.scrapValuation.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: Prisma.ScrapValuationUpdateInput): Promise<ScrapValuation> {
    return prisma.scrapValuation.update({ where: { id }, data })
  }

  async delete(id: string): Promise<ScrapValuation> {
    return prisma.scrapValuation.delete({ where: { id } })
  }
}
