import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { TransactionsService } from '../transactions.service';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  BadOperationError,
  EntityNotFoundError,
} from '../../shared/errors/errors';
import objectContaining = jasmine.objectContaining;

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should transfer funds', async () => {
    const user = {
      id: 'id',
      firstName: 'john',
      lastName: 'doe',
      email: 'johndoe@email.com',
      balance: 1000,
      password: 'password',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transferRequest = { recipientEmail: 'rcemail@test.com', amount: 500 };
    prisma.user.findUnique.mockResolvedValue(user);
    expect(await service.transferFunds(user, transferRequest)).toEqual(
      expect.objectContaining({ data: expect.any(Object) }),
    );
  });
  it('Fail if balance is insufficient', async () => {
    const user = {
      id: 'id',
      firstName: 'john',
      lastName: 'doe',
      email: 'johndoe@email.com',
      balance: 200,
      password: 'password',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockTransaction = {
      id: 'id',
      type: 'CREDIT',
      status: 'PENDING',
      userId: 'jjd',
      amount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transferRequest = { recipientEmail: 'rcemail@test.com', amount: 500 };
    prisma.user.update.mockResolvedValue(user);
    // @ts-ignore
    prisma.transaction.create.mockResolvedValue(mockTransaction);
    expect(service.transferFunds(user, transferRequest)).rejects.toThrow(
      BadOperationError,
    );
  });
  it("Fail if recipient doesn't exist", async () => {
    const user = {
      id: 'id',
      firstName: 'john',
      lastName: 'doe',
      email: 'johndoe@email.com',
      balance: 200,
      password: 'password',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transferRequest = { recipientEmail: 'rcemail@test.com', amount: 500 };
    prisma.user.findUnique.mockResolvedValue(user);
    expect(service.transferFunds(user, transferRequest)).rejects.toThrow(
      EntityNotFoundError,
    );
  });
});
