import {
  Body,
  Controller,
  HttpCode,
  Post,
  Request,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { TransferRequestDto } from './dto/transaction.dto';
import { transferRequestValidation } from './transaction.validation';
import { JoiValidationPipe } from '../pipes/joiValidationPipe';
import { ErrorsInterceptor } from '../shared/errors/interceptors';

@Controller('transactions')
@UseInterceptors(ErrorsInterceptor)
export class TransactionsController {
  constructor(private transactionService: TransactionsService) {}

  @HttpCode(200)
  @Post('transfer-fund')
  @UsePipes(new JoiValidationPipe(transferRequestValidation))
  async transferFunds(
    @Request() req,
    @Body() transferRequest: TransferRequestDto,
  ) {
    return this.transactionService.transferFunds(req.user, transferRequest);
  }
}
