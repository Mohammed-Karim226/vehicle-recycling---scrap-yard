'use server'

import { requireAdmin } from '@/lib/auth/adminSession'
import { ValidationError } from '@/lib/errors'
import { withActionError } from '@/lib/actions/safeAction'
import { VehicleYardService } from '../services/VehicleYardService'
import {
  uuidSchema,
  vehicleYardCreateSchema,
  vehicleYardUpdateSchema,
} from '@/lib/validation/schemas'
import type { VehicleYard } from '@prisma/client'

const vehicleYardService = new VehicleYardService()

export async function getVehicleYardById(id: string): Promise<VehicleYard | null> {
  return withActionError('getVehicleYardById', async () => {
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    return vehicleYardService.getVehicleById(parsedId.data)
  })
}

export async function getAllVehicleYards(): Promise<VehicleYard[]> {
  return withActionError('getAllVehicleYards', () => vehicleYardService.getAllVehicles())
}

export async function createVehicleYard(
  data: unknown
): Promise<VehicleYard> {
  return withActionError('createVehicleYard', async () => {
    await requireAdmin()
    const parsed = vehicleYardCreateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid vehicle data')
    return vehicleYardService.createVehicle(parsed.data)
  })
}

export async function updateVehicleYard(
  id: string,
  data: unknown
): Promise<VehicleYard> {
  return withActionError('updateVehicleYard', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid vehicle ID')
    const parsed = vehicleYardUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid vehicle update data')
    return vehicleYardService.updateVehicle(parsedId.data, parsed.data)
  })
}

export async function deleteVehicleYard(id: string): Promise<VehicleYard> {
  return withActionError('deleteVehicleYard', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid vehicle ID')
    return vehicleYardService.deleteVehicle(parsedId.data)
  })
}
