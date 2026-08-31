'use server'

import { withActionError } from '@/lib/actions/safeAction'
import { PartRequestService } from '@/lib/services/PartRequestService'
import { ScrapValuationService } from '@/lib/services/ScrapValuationService'
import { unstable_cache } from 'next/cache'

const partRequestService = new PartRequestService()
const scrapValuationService = new ScrapValuationService()

const getCachedSubmissionCounts = unstable_cache(
  async () => {
    const [partRequests, scrapValuations] = await Promise.all([
      partRequestService.getRequestCount(),
      scrapValuationService.getValuationCount(),
    ])
    return { partRequests, scrapValuations, total: partRequests + scrapValuations }
  },
  ['submission-counts'],
  { revalidate: 60, tags: ['submission-counts'] },
)

export async function getSubmissionCounts(): Promise<{
  partRequests: number
  scrapValuations: number
  total: number
}> {
  return withActionError('getSubmissionCounts', getCachedSubmissionCounts)
}
