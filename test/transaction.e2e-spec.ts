import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/services/prisma.service';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;
  let prisma;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('Should transfer funds to another user', async () => {
    const senderRequest = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe3@email.com',
        password: 'dkdkj23432',
      });
    const accessToken = senderRequest.body.data.token;
    const user_id = senderRequest.body.data.newUser.id;
    await supertest(app.getHttpServer()).post('/auth/register').send({
      firstName: 'john',
      lastName: 'Doe',
      email: 'johndoe2@email.com',
      password: 'dkdkj23432',
    });
    await prisma.user.update({
      where: { id: user_id },
      data: { balance: 1000 },
    });
    const transferRequest = await supertest(app.getHttpServer())
      .post('/transactions/transfer-fund')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
        amount: 500,
        recipientEmail: 'johndoe2@email.com',
      });
    console.log(transferRequest.body);
    const senderBalance = await prisma.user.findUnique({
      where: { id: user_id },
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
