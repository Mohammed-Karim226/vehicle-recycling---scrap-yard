import { prisma } from '../prisma'
import type { PartRequest, Prisma } from '@prisma/client'

export class PartRequestRepository {
  async create(data: Prisma.PartRequestCreateInput): Promise<PartRequest> {
    return prisma.partRequest.create({ data })
  }

  async findById(id: string): Promise<PartRequest | null> {
    return prisma.partRequest.findUnique({ where: { id } })
  }

  async findAll(): Promise<PartRequest[]> {
    return prisma.partRequest.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  async update(id: string, data: Prisma.PartRequestUpdateInput): Promise<PartRequest> {
    return prisma.partRequest.update({ where: { id }, data })
  }

  async delete(id: string): Promise<PartRequest> {
    return prisma.partRequest.delete({ where: { id } })
  }
}
