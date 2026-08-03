'use server'

import { requireAdmin } from '@/lib/auth/adminSession'
import { ValidationError } from '@/lib/errors'
import { withActionError } from '@/lib/actions/safeAction'
import { CatalyticConverterService } from '../services/CatalyticConverterService'
import {
  catalyticConverterCreateSchema,
  catalyticConverterLookupSchema,
  catalyticConverterUpdateSchema,
  uuidSchema,
} from '@/lib/validation/schemas'
import type { CatalyticConverterPrice } from '@prisma/client'
import type { CatalyticConverterLookupResult } from '@/types/types'

const catalyticConverterService = new CatalyticConverterService()

export async function getCatalyticConverterById(
  id: string
): Promise<CatalyticConverterPrice | null> {
  return withActionError('getCatalyticConverterById', async () => {
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) return null
    return catalyticConverterService.getPriceById(parsedId.data)
  })
}

export async function getAllCatalyticConverters(): Promise<CatalyticConverterPrice[]> {
  return withActionError('getAllCatalyticConverters', () =>
    catalyticConverterService.getAllPrices()
  )
}

export async function getActiveCatalyticConverters(): Promise<CatalyticConverterPrice[]> {
  return withActionError('getActiveCatalyticConverters', () =>
    catalyticConverterService.getAllActivePrices()
  )
}

export async function createCatalyticConverter(
  data: unknown
): Promise<CatalyticConverterPrice> {
  return withActionError('createCatalyticConverter', async () => {
    await requireAdmin()
    const parsed = catalyticConverterCreateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid catalytic converter data')
    return catalyticConverterService.createPrice(parsed.data)
  })
}

export async function updateCatalyticConverter(
  id: string,
  data: unknown
): Promise<CatalyticConverterPrice> {
  return withActionError('updateCatalyticConverter', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid converter ID')
    const parsed = catalyticConverterUpdateSchema.safeParse(data)
    if (!parsed.success) throw new ValidationError('Invalid update data')
    return catalyticConverterService.updatePrice(parsedId.data, parsed.data)
  })
}

export async function deleteCatalyticConverter(id: string): Promise<CatalyticConverterPrice> {
  return withActionError('deleteCatalyticConverter', async () => {
    await requireAdmin()
    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) throw new ValidationError('Invalid converter ID')
    return catalyticConverterService.deletePrice(parsedId.data)
  })
}

/**
 * Public lookup — no admin required.
 * Tries vehicle-specific match first, then category fallback.
 */
export async function lookupCatalyticConverter(input: {
  make?: string
  model?: string
  year?: number
  category?: string
}): Promise<CatalyticConverterLookupResult> {
  return withActionError('lookupCatalyticConverter', async () => {
    const parsed = catalyticConverterLookupSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError('Invalid lookup input')

    const { make, model, year, category } = parsed.data

    // If a category is provided, look it up directly
    if (category && !make) {
      return catalyticConverterService.lookupByCategory(category)
    }

    // Vehicle-based lookup with category fallback
    if (make) {
      const result = await catalyticConverterService.lookupByVehicle(make, model, year)
      if (result.found) return result

      // Final fallback: if a category was also provided, try it
      if (category) {
        return catalyticConverterService.lookupByCategory(category)
      }
    }

    // Category-only lookup
    if (category) {
      return catalyticConverterService.lookupByCategory(category)
    }

    return { found: false, matchedBy: 'none' }
  })
}
