import { PartRequestRepository } from '../repositories/PartRequestRepository'
import type { PartRequest, Prisma } from '@prisma/client'

export class PartRequestService {
  private repository: PartRequestRepository

  constructor() {
    this.repository = new PartRequestRepository()
  }

  async createRequest(data: Prisma.PartRequestCreateInput): Promise<PartRequest> {
    return this.repository.create(data)
  }

  async getRequestById(id: string): Promise<PartRequest | null> {
    return this.repository.findById(id)
  }

  async getRequestsByIds(ids: string[]): Promise<PartRequest[]> {
    return this.repository.findByIds(ids)
  }

  async getRequestCount(): Promise<number> {
    return this.repository.countAll()
  }

  async getAllRequests(): Promise<PartRequest[]> {
    return this.repository.findAll()
  }

  async updateRequest(id: string, data: Prisma.PartRequestUpdateInput): Promise<PartRequest> {
    return this.repository.update(id, data)
  }

  async deleteRequest(id: string): Promise<PartRequest> {
    return this.repository.delete(id)
  }
}
