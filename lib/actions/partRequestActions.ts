'use server'

import { PartRequestService } from '../services/PartRequestService'
import type { PartRequest, Prisma } from '@prisma/client'

const partRequestService = new PartRequestService()

export async function createPartRequest(data: Prisma.PartRequestCreateInput): Promise<PartRequest> {
  return partRequestService.createRequest(data)
}

export async function getPartRequestById(id: string): Promise<PartRequest | null> {
  return partRequestService.getRequestById(id)
}

export async function getAllPartRequests(): Promise<PartRequest[]> {
  return partRequestService.getAllRequests()
}

export async function updatePartRequest(id: string, data: Prisma.PartRequestUpdateInput): Promise<PartRequest> {
  return partRequestService.updateRequest(id, data)
}

export async function deletePartRequest(id: string): Promise<PartRequest> {
  return partRequestService.deleteRequest(id)
}
