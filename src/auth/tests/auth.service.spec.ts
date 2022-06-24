import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';
import { JwtModule } from '@nestjs/jwt';

import { PrismaService } from '../../shared/services/prisma.service';
import { AuthService } from '../auth.service';
import { EntityExistsError } from '../../shared/errors/errors';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<any>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'a secret',
          signOptions: { expiresIn: '7d' },
        }),
      ],
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
        isActive: true,
        emailVerified: false,
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
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(user);
      expect(service.createUser(user)).rejects.toThrow(EntityExistsError);
    });
  });
  describe('User login', () => {
    it('Validate user', async () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const loginDetails = { email: 'johndoe@email.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true);
      const logindata = await service.validateUser(loginDetails);
      expect(logindata).toEqual(user);
    });

    it('User email does not exist', async () => {
      const loginDetails = { email: 'johndoe@email.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.validateUser(loginDetails)).toBe(null);
    });

    it('Incorrect password', async () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const loginDetails = { email: 'johndoe@email.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false);
      expect(await service.validateUser(loginDetails)).toBe(null);
    });

    it('Login - Get access token', async () => {
      const user = {
        id: 'id',
        firstName: 'john',
        lastName: 'doe',
        email: 'johndoe@email.com',
        balance: 0,
        password: 'password',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const data = await service.loginUser(user);
      expect(data.data.token).toEqual(expect.any(String));
    });
  });
});
