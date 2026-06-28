'use server'

import { requireAdmin } from '@/lib/auth/adminSession'
import { ValidationError } from '@/lib/errors'
import { withActionError } from '@/lib/actions/safeAction'
import { PartRequestService } from '../services/PartRequestService'
import {
  idsBatchSchema,
  partRequestCreateSchema,
  partRequestUpdateSchema,
  uuidSchema,
} from '@/lib/validation/schemas'
import type { PartRequest } from '@prisma/client'
import { sendWhatsAppViaTwilio, buildScrapQuoteMessage } from '@/lib/whatsapp'

const partRequestService = new PartRequestService()

export async function createPartRequest(
  data: unknown,
  options?: {
    valuationData?: {
      vehicleName: string
      registration: string
      postcode: string
      estimatedValue: number
      weightKg: number
      engineSize: string
      fuelType: string
    }
  }
): Promise<PartRequest> {
  return withActionError('createPartRequest', async () => {
    const parsed = partRequestCreateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid part request data')

    const partRequest = await partRequestService.createRequest({
      ...parsed.data,
      vehicleId: parsed.data.vehicleId ?? undefined,
    })

    // Try to send WhatsApp notification
    if (options?.valuationData) {
      const message = buildScrapQuoteMessage({
        ...options.valuationData,
        customerPhone: parsed.data.phone,
      })
      const recipientPhone = process.env.RECIPIENT_WHATSAPP
      if (recipientPhone) {
        await sendWhatsAppViaTwilio({
          toPhone: recipientPhone,
          message,
        })
      }
    }

    return partRequest
  })
}

export async function getPartRequestById(id: string): Promise<PartRequest | null> {
  return withActionError('getPartRequestById', async () => {
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    return partRequestService.getRequestById(parsedId.data)
  })
}

export async function getAllPartRequests(): Promise<PartRequest[]> {
  return withActionError('getAllPartRequests', async () => {
    await requireAdmin()
    return partRequestService.getAllRequests()
  })
}

export async function getRequestsByIds(input: {
  partIds: string[]
  scrapIds: string[]
}): Promise<{ partRequests: PartRequest[] }> {
  return withActionError('getRequestsByIds', async () => {
    const parsed = idsBatchSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid request IDs')
    const partRequests = await partRequestService.getRequestsByIds(parsed.data.partIds)
    return { partRequests }
  })
}

export async function lookupPartRequestById(id: string): Promise<PartRequest | null> {
  return withActionError('lookupPartRequestById', async () => {
    const parsedId = uuidSchema.safeParse(id.trim())
    if (!parsedId.success) return null
    return partRequestService.getRequestById(parsedId.data)
  })
}

export async function updatePartRequest(
  id: string,
  data: unknown
): Promise<PartRequest> {
  return withActionError('updatePartRequest', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid request ID')
    const parsed = partRequestUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid update data')
    return partRequestService.updateRequest(parsedId.data, parsed.data)
  })
}

export async function deletePartRequest(id: string): Promise<PartRequest> {
  return withActionError('deletePartRequest', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid request ID')
    return partRequestService.deleteRequest(parsedId.data)
  })
}
