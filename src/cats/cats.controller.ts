import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { paginated } from '../common/web-response';
import type { WebResponse } from '../common/web-response';
import { CatsService } from './cats.service';
import {
  CatListResponseDto,
  CatResponseDto,
  CreateCatDto,
  ListCatsQueryDto,
  UpdateCatDto,
} from './cats.dto';
import type { Cat } from './cats.dto';

@ApiTags('cats')
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  @ZodResponse({ type: CatListResponseDto })
  list(@Query() query: ListCatsQueryDto): WebResponse<Cat[]> {
    const { items, total } = this.catsService.list(query.limit, query.offset);
    return paginated(items, query, total);
  }

  @Get(':id')
  @ZodResponse({ type: CatResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string): WebResponse<Cat> {
    return { data: this.catsService.get(id) };
  }

  @Post()
  @ZodResponse({ status: 201, type: CatResponseDto })
  create(@Body() body: CreateCatDto): WebResponse<Cat> {
    return { data: this.catsService.create(body) };
  }

  @Patch(':id')
  @ZodResponse({ type: CatResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCatDto,
  ): WebResponse<Cat> {
    return { data: this.catsService.update(id, body) };
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.catsService.remove(id);
  }
}
