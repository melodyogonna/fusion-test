import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { TransactionsService } from '../transactions.service';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  BadOperationError,
  EntityNotFoundError,
} from '../../shared/errors/errors';
import { PaymentService } from '../../payment/payment.service';
import { of } from 'rxjs';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaService>;
  let paymentService: DeepMockProxy<PaymentService>;
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
        {
          provide: PaymentService,
          useFactory: () => mockDeep<PaymentService>(),
        },
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);
    paymentService = module.get(PaymentService);
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

  it('Initialize account funding', async () => {
    // @ts-ignore
    prisma.transaction.create.mockResolvedValue(mockTransaction);
    paymentService.initPayment.mockResolvedValue({ data: expect.any(Object) });
    expect(await service.initializeAccountFunding(user, 500)).toEqual(
      expect.objectContaining({ data: expect.any(Object) }),
    );
  });
  it('it verifies account funding', async () => {
    // @ts-ignore
    prisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    // @ts-ignore
    prisma.transaction.update.mockResolvedValue(mockTransaction);
    paymentService.verifyPayment.mockReturnValue(
      of({ tx_ref: expect.any(String) }),
    );
    expect(service.verifyPaymentTransaction(user, 'kdkkdjj', 'kkdkkd')).toEqual(
      'kdkk',
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
