import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';

import { ErrorsInterceptor } from '../shared/errors/interceptors';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/user.dto';
import { JoiValidationPipe } from '../pipes/joiValidationPipe';
import { createUserValidator } from './validations/user.validation';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './utils';

@Controller('auth')
@UseInterceptors(ErrorsInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new JoiValidationPipe(createUserValidator))
  async register(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.loginUser(req.user);
  }
}
