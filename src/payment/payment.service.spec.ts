import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { HttpService } from '@nestjs/axios';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../shared/services/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpService: DeepMockProxy<HttpService>;
  let prismaService: DeepMockProxy<PrismaService>;
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
      imports: [ConfigModule.forRoot()],
      providers: [
        PaymentService,
        { provide: PrismaService, useFactory: () => mockDeep<PrismaService>() },
      ],
    })
      .useMocker((token) => {
        if (token == HttpService) {
          return mockDeep<HttpService>();
        }
        return jest.fn();
      })
      .compile();

    service = module.get<PaymentService>(PaymentService);
    httpService = module.get(HttpService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Initialize payment', async () => {
    // @ts-ignore
    prismaService.transaction.create.mockResolvedValue(mockTransaction);
    jest.spyOn(httpService, 'post').mockReturnValue(
      of({
        status: 200,
        statusText: 'successful',
        headers: {},
        config: {},
        data: {
          status: 'success',
          message: 'Hosted Link',
          data: {
            link: 'https://api.flutterwave.com/v3/hosted/pay/f524c1196ffda5556341',
          },
        },
      }),
    );
    const paymentData = {
      userId: 'a user',
      email: 'email',
      amount: 100,
      currency: 'NGN',
    };
    expect(await service.initPayment(paymentData)).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ link: expect.any(String) }),
      }),
    );
  });
  it('Shoud verify payment', async () => {
    expect(service.verifyPayment(12345)).toReturn();
  });
});
