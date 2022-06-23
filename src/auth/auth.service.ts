import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../shared/services/prisma.service';
import {
  EntityExistsError,
  EntityNotFoundError,
} from '../shared/errors/errors';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

  async loginUser(loginDetails: { email: string; password: string }) {
    const user = this.prisma.user.findUnique({
      where: { email: loginDetails.email },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      throw new EntityNotFoundError('Email or Password is incorrect');
    }

    const passwordComparison = await bcrypt.compare(
      loginDetails.password,
      user.password,
    );
  }
}
