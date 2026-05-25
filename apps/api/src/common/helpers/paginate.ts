export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function paginate<T>(
  findMany: (args: { skip: number; take: number }) => Promise<T[]>,
  count: () => Promise<number>,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([findMany({ skip, take: limit }), count()]);
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  };
}
