import { PrismaClient } from '@prisma/client';
import { 
  BaseRepository, 
  TransactionalRepository, 
  FindManyOptions, 
  CountOptions, 
  CreateData, 
  UpdateData,
  TransactionContext 
} from '../interfaces/BaseRepository';

/**
 * Abstract base class for Prisma repositories
 * Provides common CRUD operations and transaction support
 */
export abstract class BasePrismaRepository<T, ID = string> 
  implements TransactionalRepository<T, ID> {
  
  protected prisma: PrismaClient;
  protected abstract modelName: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get the Prisma model delegate for this repository
   */
  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find a single record by ID
   */
  async findById(id: ID): Promise<T | null> {
    try {
      return await this.model.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error(`Error finding ${this.modelName} by ID:`, error);
      throw new Error(`Failed to find ${this.modelName} with ID: ${id}`);
    }
  }

  /**
   * Find multiple records with options
   */
  async findMany(options: FindManyOptions<T> = {}): Promise<T[]> {
    try {
      const { where, orderBy, skip, take, include } = options;
      
      return await this.model.findMany({
        where,
        orderBy,
        skip,
        take,
        include
      });
    } catch (error) {
      console.error(`Error finding multiple ${this.modelName}:`, error);
      throw new Error(`Failed to find ${this.modelName} records`);
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateData<T>): Promise<T> {
    try {
      return await this.model.create({
        data
      });
    } catch (error) {
      console.error(`Error creating ${this.modelName}:`, error);
      throw new Error(`Failed to create ${this.modelName}`);
    }
  }

  /**
   * Update an existing record
   */
  async update(id: ID, data: UpdateData<T>): Promise<T> {
    try {
      return await this.model.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error(`Error updating ${this.modelName}:`, error);
      throw new Error(`Failed to update ${this.modelName} with ID: ${id}`);
    }
  }

  /**
   * Delete a record
   */
  async delete(id: ID): Promise<void> {
    try {
      await this.model.delete({
        where: { id }
      });
    } catch (error) {
      console.error(`Error deleting ${this.modelName}:`, error);
      throw new Error(`Failed to delete ${this.modelName} with ID: ${id}`);
    }
  }

  /**
   * Count records matching criteria
   */
  async count(options: CountOptions<T> = {}): Promise<number> {
    try {
      const { where } = options;
      
      return await this.model.count({
        where
      });
    } catch (error) {
      console.error(`Error counting ${this.modelName}:`, error);
      throw new Error(`Failed to count ${this.modelName} records`);
    }
  }

  /**
   * Execute a function within a transaction
   */
  async withTransaction<R>(
    fn: (repo: this, tx: TransactionContext) => Promise<R>
  ): Promise<R> {
    return await this.prisma.$transaction(async (prismaTransaction) => {
      // Create a new repository instance with the transaction client
      const transactionalRepo = this.createTransactionalInstance(prismaTransaction);
      const transactionContext: TransactionContext = { tx: prismaTransaction };
      
      return await fn(transactionalRepo, transactionContext);
    });
  }

  /**
   * Create a new instance of this repository with a transaction client
   * Subclasses should override this method to return the correct type
   */
  protected createTransactionalInstance(prismaTransaction: any): this {
    // Create a new instance with the transaction client
    const TransactionalClass = this.constructor as new (prisma: any) => this;
    return new TransactionalClass(prismaTransaction);
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  protected async executeRaw(sql: string, ...params: any[]): Promise<any> {
    try {
      return await this.prisma.$executeRaw`${sql}`;
    } catch (error) {
      console.error('Error executing raw SQL:', error);
      throw new Error('Failed to execute raw SQL query');
    }
  }

  /**
   * Query raw SQL (use with caution)
   */
  protected async queryRaw(sql: string, ...params: any[]): Promise<any> {
    try {
      return await this.prisma.$queryRaw`${sql}`;
    } catch (error) {
      console.error('Error querying raw SQL:', error);
      throw new Error('Failed to query raw SQL');
    }
  }

  /**
   * Batch operations helper
   */
  protected async batchCreate(dataArray: CreateData<T>[]): Promise<{ count: number }> {
    try {
      return await this.model.createMany({
        data: dataArray,
        skipDuplicates: true
      });
    } catch (error) {
      console.error(`Error batch creating ${this.modelName}:`, error);
      throw new Error(`Failed to batch create ${this.modelName} records`);
    }
  }

  /**
   * Upsert operation (create or update)
   */
  protected async upsert(
    where: any,
    create: CreateData<T>,
    update: UpdateData<T>
  ): Promise<T> {
    try {
      return await this.model.upsert({
        where,
        create,
        update
      });
    } catch (error) {
      console.error(`Error upserting ${this.modelName}:`, error);
      throw new Error(`Failed to upsert ${this.modelName}`);
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: ID): Promise<boolean> {
    try {
      const count = await this.model.count({
        where: { id }
      });
      return count > 0;
    } catch (error) {
      console.error(`Error checking if ${this.modelName} exists:`, error);
      return false;
    }
  }

  /**
   * Soft delete helper (if the model supports it)
   */
  protected async softDelete(id: ID): Promise<T> {
    try {
      return await this.model.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    } catch (error) {
      console.error(`Error soft deleting ${this.modelName}:`, error);
      throw new Error(`Failed to soft delete ${this.modelName} with ID: ${id}`);
    }
  }

  /**
   * Build where clause for text search
   */
  protected buildTextSearchWhere(fields: string[], query: string): any {
    if (!query || query.trim().length === 0) {
      return {};
    }

    const searchTerm = query.trim();
    const searchConditions = fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }));

    return {
      OR: searchConditions
    };
  }

  /**
   * Build date range where clause
   */
  protected buildDateRangeWhere(
    field: string, 
    timeframe: { start: Date; end: Date }
  ): any {
    return {
      [field]: {
        gte: timeframe.start,
        lte: timeframe.end
      }
    };
  }

  /**
   * Validate UUID format
   */
  protected validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }
}