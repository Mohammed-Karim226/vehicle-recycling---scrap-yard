import { ScrapValuationRepository } from '../repositories/ScrapValuationRepository'
import type { ScrapValuation, Prisma } from '@prisma/client'

export class ScrapValuationService {
  private repository: ScrapValuationRepository

  constructor() {
    this.repository = new ScrapValuationRepository()
  }

  async createValuation(data: Prisma.ScrapValuationCreateInput): Promise<ScrapValuation> {
    return this.repository.create(data)
  }

  async getValuationById(id: string): Promise<ScrapValuation | null> {
    return this.repository.findById(id)
  }

  async getAllValuations(): Promise<ScrapValuation[]> {
    return this.repository.findAll()
  }

  async updateValuation(id: string, data: Prisma.ScrapValuationUpdateInput): Promise<ScrapValuation> {
    return this.repository.update(id, data)
  }

  async deleteValuation(id: string): Promise<ScrapValuation> {
    return this.repository.delete(id)
  }
}
