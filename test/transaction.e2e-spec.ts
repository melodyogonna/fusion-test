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
    const initialUser = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe3@email.com',
        password: 'dkdkj23432',
      });
    const accessToken = initialUser.body.data.token;
    const user_id = initialUser.body.data.newUser.id;
    const request = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe2@email.com',
        password: 'dkdkj23432',
      });
    const data = request.body.data;
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
    const senderBalance = await prisma.user.findUnique({
      where: { id: user_id },
      select: { balance: true },
    });

    const receiverBalance = await prisma.user.findUnique({
      where: { id: data.newUser.id },
      select: { balance: true },
    });
    expect(transferRequest.status).toEqual(200);
    expect(senderBalance?.balance).toEqual(500);
    expect(receiverBalance?.balance).toEqual(500);
  });
});
