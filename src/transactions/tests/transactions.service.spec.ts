import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsService],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.todo('Should transfer funds');
  it.todo('Fail if balance is insufficient');
  it.todo("Fail if recipient doesn't exist");
});
