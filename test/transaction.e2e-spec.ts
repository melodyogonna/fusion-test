import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/services/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;
  let prisma;
  let authService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    authService = moduleFixture.get(AuthService);
    await app.init();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('Should transfer funds to another user', async () => {
    const user1 = await prisma.user.create({
      data: {
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe3@email.com',
        password: 'dkdkj23432',
      },
    });
    const user2 = await prisma.user.create({
      data: {
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe2@email.com',
        password: 'dkdkj23432',
      },
    });
    const accessToken = await authService.loginUser(user1);
    await prisma.user.update({
      where: { id: user1.id },
      data: { balance: 1000 },
    });
    const transferRequest = await supertest(app.getHttpServer())
      .post('/transactions/transfer-fund')
      .set('Authorization', 'Bearer ' + accessToken.data.token)
      .send({
        amount: 500,
        recipientEmail: 'johndoe2@email.com',
      });
    const senderBalance = await prisma.user.findUnique({
      where: { id: user1.id },
      select: { balance: true },
    });

    const receiverBalance = await prisma.user.findUnique({
      where: { email: 'johndoe2@email.com' },
      select: { balance: true },
    });
    expect(transferRequest.status).toEqual(200);
    expect(transferRequest.body).toEqual(
      expect.objectContaining({ data: expect.any(Object) }),
    );
    expect(senderBalance?.balance).toEqual(500);
    expect(receiverBalance?.balance).toEqual(500);
  });
});
