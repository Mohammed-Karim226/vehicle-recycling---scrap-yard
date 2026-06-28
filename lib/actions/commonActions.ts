'use server'

import { withActionError } from '@/lib/actions/safeAction'
import { PartRequestService } from '@/lib/services/PartRequestService'
import { ScrapValuationService } from '@/lib/services/ScrapValuationService'

const partRequestService = new PartRequestService()
const scrapValuationService = new ScrapValuationService()

export async function getSubmissionCounts(): Promise<{
  partRequests: number
  scrapValuations: number
  total: number
}> {
  return withActionError('getSubmissionCounts', async () => {
    const [partRequests, scrapValuations] = await Promise.all([
      partRequestService.getRequestCount(),
      scrapValuationService.getValuationCount(),
    ])
    return { partRequests, scrapValuations, total: partRequests + scrapValuations }
  })
}
