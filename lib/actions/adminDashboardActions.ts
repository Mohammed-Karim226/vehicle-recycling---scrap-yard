'use server'

import type { PartRequest, ScrapMetalPrice, VehicleYard } from '@prisma/client'
import { requireAdmin } from '@/lib/auth/adminSession'
import { withActionError } from '@/lib/actions/safeAction'
import { PartRequestService } from '@/lib/services/PartRequestService'
import { ScrapMetalPriceService } from '@/lib/services/ScrapMetalPriceService'
import { ScrapValuationService } from '@/lib/services/ScrapValuationService'
import { VehicleYardService } from '@/lib/services/VehicleYardService'
import type { AdminScrapValuation } from '@/lib/actions/scrapValuationActions'
import type { SerializedScrapMetalPrice } from '@/lib/actions/scrapMetalPriceActions'

export interface AdminDashboardData {
  vehicles: VehicleYard[]
  scrapValuations: AdminScrapValuation[]
  partRequests: PartRequest[]
  scrapMetalPrices: SerializedScrapMetalPrice[]
}

const vehicleYardService = new VehicleYardService()
const scrapValuationService = new ScrapValuationService()
const partRequestService = new PartRequestService()
const scrapMetalPriceService = new ScrapMetalPriceService()

function serializeValuation(value: Awaited<ReturnType<ScrapValuationService['getAllValuations']>>[number]): AdminScrapValuation {
  return {
    ...value,
    estimatedValue: Number(value.estimatedValue),
    weightKg: Number(value.weightKg),
  }
}

function serializePrice(value: ScrapMetalPrice): SerializedScrapMetalPrice {
  return {
    ...value,
    pricePerKgMin: Number(value.pricePerKgMin),
    pricePerKgMax: Number(value.pricePerKgMax),
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return withActionError('getAdminDashboardData', async () => {
    await requireAdmin()
    const [vehicles, scrapValuations, partRequests, scrapMetalPrices] = await Promise.all([
      vehicleYardService.getAllVehicles(),
      scrapValuationService.getAllValuations(),
      partRequestService.getAllRequests(),
      scrapMetalPriceService.getAllPrices(),
    ])

    return {
      vehicles,
      scrapValuations: scrapValuations.map(serializeValuation),
      partRequests,
      scrapMetalPrices: scrapMetalPrices.map(serializePrice),
    }
  })
}
