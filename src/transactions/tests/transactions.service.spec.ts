import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { TransactionsService } from '../transactions.service';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  BadOperationError,
  EntityNotFoundError,
} from '../../shared/errors/errors';
import objectContaining = jasmine.objectContaining;
import exp from 'constants';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaService>;
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

  const mockTransaction = {
    id: 'id',
    type: 'CREDIT',
    status: 'SUCCESSFUL',
    userId: 'jjd',
    amount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    const transferRequest = { recipientEmail: 'rcemail@test.com', amount: 500 };
    prisma.user.findUnique.mockResolvedValue(user);
    // @ts-ignore
    expect(await service.transferFunds(user, transferRequest)).toEqual(
      expect.objectContaining({ data: undefined }),
    );
  });
  it('Fail if balance is insufficient', async () => {
    user['balance'] = 200;
    const transferRequest = { recipientEmail: 'rcemail@test.com', amount: 500 };
    prisma.user.findUnique.mockResolvedValue(user);
    expect(service.transferFunds(user, transferRequest)).rejects.toThrow(
      BadOperationError,
    );
  });
  it("Fail if recipient doesn't exist", async () => {
    user['balance'] = 200;
    const transferRequest = { recipientEmail: 'rcemail@test.com', amount: 500 };
    prisma.user.findUnique.mockResolvedValue(null);
    expect(service.transferFunds(user, transferRequest)).rejects.toThrow(
      EntityNotFoundError,
    );
  });

  it.skip('Initialize account funding', async () => {
    // @ts-ignore
    prisma.transaction.create.mockResolvedValue(mockTransaction);
    const fundDetails = {
      amount: 500,
      cardNumber: 123456789,
      cardCvv: 455,
      cardExpiry: '15/19/2020',
    };
    expect(await service.initializeAccountFunding(user, 500)).toEqual(
      expect.objectContaining({ data: expect.any(Object) }),
    );
  });
  it.todo('Fail if payment gateway is unresponsive');
  it('Get user transactions', async () => {
    const returnedTransactions = [mockTransaction, mockTransaction];
    // @ts-ignore
    prisma.transaction.findMany.mockResolvedValue(returnedTransactions);
    expect(await service.getUserTransactions(user)).toEqual(
      expect.objectContaining({ data: returnedTransactions }),
    );
    expect(prisma.transaction.findMany).toHaveBeenCalled();
  });
});
