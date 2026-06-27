import { prisma } from '../prisma'
import type { PartRequest, Prisma } from '@prisma/client'

export class PartRequestRepository {
  async create(data: Prisma.PartRequestCreateInput): Promise<PartRequest> {
    return prisma.partRequest.create({ data })
  }

  async findById(id: string): Promise<PartRequest | null> {
    return prisma.partRequest.findUnique({ where: { id } })
  }

  async findByIds(ids: string[]): Promise<PartRequest[]> {
    if (ids.length === 0) return []
    return prisma.partRequest.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async countAll(): Promise<number> {
    return prisma.partRequest.count()
  }

  async findAll(): Promise<PartRequest[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    try {
      await prisma.partRequest.deleteMany({
        where: {
          status: {
            in: ['No_Stock', 'Cancelled']
          },
          updatedAt: {
            lt: threeDaysAgo
          }
        }
      });
    } catch (err) {
      console.error("Error doing auto-cleanup of part requests:", err);
    }

    return prisma.partRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: Prisma.PartRequestUpdateInput): Promise<PartRequest> {
    return prisma.partRequest.update({ where: { id }, data })
  }

  async delete(id: string): Promise<PartRequest> {
    return prisma.partRequest.delete({ where: { id } })
  }
}
