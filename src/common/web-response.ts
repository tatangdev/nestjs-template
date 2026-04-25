import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PagingSchema = z.object({
  size: z.number().int().nonnegative(),
  total_page: z.number().int().nonnegative(),
  current_page: z.number().int().nonnegative(),
  total_count: z.number().int().nonnegative().optional(),
});

export type Paging = z.infer<typeof PagingSchema>;

export const webResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data: data.optional(),
    errors: z.string().optional(),
    paging: PagingSchema.optional(),
  });

export type WebResponse<T> = {
  data?: T;
  errors?: string;
  paging?: Paging;
};

export const WebResponseDto = <T extends z.ZodTypeAny>(data: T) =>
  createZodDto(webResponseSchema(data));

export const WebResponseListDto = <T extends z.ZodTypeAny>(data: T) =>
  createZodDto(webResponseSchema(z.array(data)));

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginated = <T>(
  items: T[],
  query: PaginationQuery,
  total: number,
): WebResponse<T[]> => ({
  data: items,
  paging: {
    size: query.limit,
    current_page: Math.floor(query.offset / query.limit) + 1,
    total_page: Math.max(1, Math.ceil(total / query.limit)),
    total_count: total,
  },
});
