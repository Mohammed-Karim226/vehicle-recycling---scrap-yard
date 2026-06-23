'use server'

import { VehicleYardService } from '../services/VehicleYardService'
import type { VehicleYard, Prisma } from '@prisma/client'

const vehicleYardService = new VehicleYardService()

export async function createVehicleYard(data: Prisma.VehicleYardCreateInput): Promise<VehicleYard> {
  return vehicleYardService.createVehicle(data)
}

export async function getVehicleYardById(id: string): Promise<VehicleYard | null> {
  return vehicleYardService.getVehicleById(id)
}

export async function getAllVehicleYards(): Promise<VehicleYard[]> {
  return vehicleYardService.getAllVehicles()
}

export async function updateVehicleYard(id: string, data: Prisma.VehicleYardUpdateInput): Promise<VehicleYard> {
  return vehicleYardService.updateVehicle(id, data)
}

export async function deleteVehicleYard(id: string): Promise<VehicleYard> {
  return vehicleYardService.deleteVehicle(id)
}
