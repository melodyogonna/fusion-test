import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/services/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    const prisma = new PrismaService();
    await prisma.user.deleteMany();
  });

  it('/auth/register - Register a user', async () => {
    const request = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe@email.com',
        password: 'dkdkj23432',
      });
    expect(request.statusCode).toBe(201);
  });

  it('/auth/register - fail validation', async () => {
    const request = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe@email',
        password: 'dkdkj26',
      });
    console.log(request.body);
    expect(request.status).toBe(400);
    expect(request.body.message).toEqual('"email" must be a valid email');
  });

  it('/auth/register - User already exist', async () => {
    await supertest(app.getHttpServer()).post('/auth/register').send({
      firstName: 'john',
      lastName: 'Doe',
      email: 'johndoe@email.com',
      password: 'dkdkj23432',
    });
    const request = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'john',
        lastName: 'Doe',
        email: 'johndoe@email.com',
        password: 'dkdkj23453',
      });
    expect(request.status).toBe(400);
    expect(request.body.message).toEqual('User with email already exist');
  });
});
