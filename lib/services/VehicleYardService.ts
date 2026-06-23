import { VehicleYardRepository } from '../repositories/VehicleYardRepository'
import type { VehicleYard, Prisma } from '@prisma/client'

export class VehicleYardService {
  private repository: VehicleYardRepository

  constructor() {
    this.repository = new VehicleYardRepository()
  }

  async createVehicle(data: Prisma.VehicleYardCreateInput): Promise<VehicleYard> {
    return this.repository.create(data)
  }

  async getVehicleById(id: string): Promise<VehicleYard | null> {
    return this.repository.findById(id)
  }

  async getAllVehicles(): Promise<VehicleYard[]> {
    return this.repository.findAll()
  }

  async updateVehicle(id: string, data: Prisma.VehicleYardUpdateInput): Promise<VehicleYard> {
    return this.repository.update(id, data)
  }

  async deleteVehicle(id: string): Promise<VehicleYard> {
    return this.repository.delete(id)
  }
}
