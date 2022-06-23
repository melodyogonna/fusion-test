import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../shared/services/prisma.service';
import { AuthService } from '../auth.service';
import {
  EntityExistsError,
  EntityNotFoundError,
  ValueError,
} from '../../shared/errors/errors';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<any>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('User creation', () => {
    it('Should create a user', async () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(user);
      expect(await service.createUser(user)).toEqual({ data: user });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('Throw error if user with email already exist', () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(user);
      expect(service.createUser(user)).rejects.toThrow(EntityExistsError);
    });
  });
  describe('User login', () => {
    it('Should login a user', async () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const loginDetails = { email: 'johndoe@email.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue(user);
      const logindata = await service.loginUser(loginDetails);
      mockedBcrypt.compare.mockResolvedValue(true);
      expect(loginDetails.data.token).toBe(expect.any(String));
    });

    it('User email does not exist', async () => {
      const loginDetails = { email: 'johndoe@email.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue(null);
      expect(service.loginUser).rejects.toThrow(EntityNotFoundError);
    });

    it('Incorrect password', async () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const loginDetails = { email: 'johndoe@email.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false);
      expect(service.loginUser).rejects.toThrow(ValueError);
    });
  });
});
