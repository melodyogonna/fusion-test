import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

import { PrismaService } from '../shared/services/prisma.service';
import {
  EntityExistsError,
  EntityNotFoundError,
} from '../shared/errors/errors';
import { LoginDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async createUser(data: Prisma.UserCreateInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      throw new EntityExistsError('User with email already exist');
    }

    const hashedPassword = await bcrypt.hash(data.password, 2);
    data.password = hashedPassword;
    const newUser = await this.prisma.user.create({ data });
    return { data: newUser };
  }

  /***
   * Validation function for passport local strategy, validates user's login details.
   * @param loginDetails
   */
  async validateUser(loginDetails: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDetails.email },
    });

    if (!user) {
      return null;
    }

    const passwordComparison = await bcrypt.compare(
      loginDetails.password,
      user.password,
    );

    if (!passwordComparison) {
      return null;
    }

    return user;
  }

  /***
   * JWT generation function for passport jwt strategy, this function will generate a jwt token for the user
   * after the validation function has validated a user's login details.
   * @param user
   */
  async loginUser(user: User) {
    const payload = { sub: user.id, user };
    const token = this.jwtService.sign(payload);
    return { data: { token } };
  }
}
