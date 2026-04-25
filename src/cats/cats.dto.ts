import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  paginationQuerySchema,
  WebResponseDto,
  WebResponseListDto,
} from '../common/web-response';

export const CatSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50),
  age: z.number().int().nonnegative().max(40),
  breed: z.string().min(1).max(50).optional(),
});
export type Cat = z.infer<typeof CatSchema>;

export class CreateCatDto extends createZodDto(CatSchema.omit({ id: true })) {}
export class UpdateCatDto extends createZodDto(
  CatSchema.omit({ id: true }).partial(),
) {}
export class ListCatsQueryDto extends createZodDto(paginationQuerySchema) {}

export class CatResponseDto extends WebResponseDto(CatSchema) {}
export class CatListResponseDto extends WebResponseListDto(CatSchema) {}
