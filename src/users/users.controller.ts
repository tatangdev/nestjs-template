import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { Auth, AuthGuard } from '../common/auth.guard';
import type { WebResponse } from '../common/web-response';
import type { User } from '../db/schema';
import { UpdateUserDto, UserResponseDto, type UserResponse } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('app/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/me')
  @ZodResponse({ type: UserResponseDto })
  me(@Auth() user: User): WebResponse<UserResponse> {
    return { data: this.usersService.toResponse(user) };
  }

  @Patch('/me')
  @ZodResponse({ type: UserResponseDto })
  async update(
    @Auth() user: User,
    @Body() body: UpdateUserDto,
  ): Promise<WebResponse<UserResponse>> {
    return { data: await this.usersService.update(user.id, body) };
  }
}
