import { prisma } from '../prisma'
import type { VehicleYard, Prisma } from '@prisma/client'

export class VehicleYardRepository {
  async create(data: Prisma.VehicleYardCreateInput): Promise<VehicleYard> {
    return prisma.vehicleYard.create({ data })
  }

  async findById(id: string): Promise<VehicleYard | null> {
    return prisma.vehicleYard.findUnique({ where: { id } })
  }

  async findAll(): Promise<VehicleYard[]> {
    return prisma.vehicleYard.findMany({
      orderBy: { arrivedDate: 'desc' }
    })
  }

  async update(id: string, data: Prisma.VehicleYardUpdateInput): Promise<VehicleYard> {
    return prisma.vehicleYard.update({ where: { id }, data })
  }

  async delete(id: string): Promise<VehicleYard> {
    return prisma.vehicleYard.delete({ where: { id } })
  }
}
