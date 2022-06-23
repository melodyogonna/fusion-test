import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: DeepMockProxy<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useFactory: () => mockDeep<AuthService>() },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('User registration', () => {
    it('Register a user', async () => {
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
      service.createUser.mockResolvedValue({ data: user });
      expect(await controller.register(user)).toEqual({ data: user });
      expect(service.createUser).toHaveBeenCalled();
    });
  });
});
