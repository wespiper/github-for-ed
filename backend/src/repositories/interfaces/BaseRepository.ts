/**
 * Base Repository Interface
 * Defines common CRUD operations for all repositories
 */
export interface BaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  create(data: CreateData<T>): Promise<T>;
  update(id: ID, data: UpdateData<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  count(options?: CountOptions<T>): Promise<number>;
}

/**
 * Common query options for finding multiple records
 */
export interface FindManyOptions<T> {
  where?: Partial<T>;
  orderBy?: OrderByOptions<T>;
  skip?: number;
  take?: number;
  include?: any; // Prisma-specific include for relations
}

/**
 * Order by options for sorting
 */
export type OrderByOptions<T> = {
  [K in keyof T]?: 'asc' | 'desc';
};

/**
 * Count options for counting records
 */
export interface CountOptions<T> {
  where?: Partial<T>;
}

/**
 * Data for creating new records (excludes auto-generated fields)
 */
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating records (partial and excludes auto-generated fields)
 */
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Transaction context for database operations
 */
export interface TransactionContext {
  // Prisma transaction client will be passed here
  tx: any;
}

/**
 * Base Repository with transaction support
 */
export interface TransactionalRepository<T, ID = string> extends BaseRepository<T, ID> {
  withTransaction<R>(fn: (repo: this, tx: TransactionContext) => Promise<R>): Promise<R>;
}