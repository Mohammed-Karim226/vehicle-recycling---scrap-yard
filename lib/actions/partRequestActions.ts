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
import { enforceRateLimit } from '@/lib/security/rateLimit'

const partRequestService = new PartRequestService()

export type PublicPartRequest = {
  trackingToken: string
  vehicleName: string
  partsNeeded: string
  status: PartRequest['status']
  notes: string | null
  createdAt: string
}

function toPublicPartRequest(request: PartRequest): PublicPartRequest {
  const record = request as PartRequest & { trackingToken: string }
  return {
    trackingToken: record.trackingToken,
    vehicleName: request.vehicleName,
    partsNeeded: request.partsNeeded,
    status: request.status,
    notes: request.notes,
    createdAt: request.createdAt.toISOString(),
  }
}

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
): Promise<PartRequest & { trackingToken: string }> {
  return withActionError('createPartRequest', async () => {
    await enforceRateLimit('create-part-request', 10, 60 * 60)
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

    return partRequest as PartRequest & { trackingToken: string }
  })
}

export async function getPartRequestById(id: string): Promise<PartRequest | null> {
  return withActionError('getPartRequestById', async () => {
    await requireAdmin()
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
}): Promise<{ partRequests: PublicPartRequest[] }> {
  return withActionError('getRequestsByIds', async () => {
    const parsed = idsBatchSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid request IDs')
    if (parsed.data.partIds.length === 0) return { partRequests: [] }
    await enforceRateLimit('batch-part-requests', 60, 60 * 60)
    const partRequests = await partRequestService.getRequestsByTrackingTokens(parsed.data.partIds)
    return { partRequests: partRequests.map(toPublicPartRequest) }
  })
}

export async function lookupPartRequestById(id: string): Promise<PublicPartRequest | null> {
  return withActionError('lookupPartRequestById', async () => {
    await enforceRateLimit('lookup-part-request', 30, 60 * 60)
    const parsedId = uuidSchema.safeParse(id.trim())
    if (!parsedId.success) return null
    const rows = await partRequestService.getRequestsByTrackingTokens([parsedId.data])
    return rows[0] ? toPublicPartRequest(rows[0]) : null
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
