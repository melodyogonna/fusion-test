import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Request,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { FundAccountDto, TransferRequestDto } from './dto/transaction.dto';
import {
  accountFundValidator,
  transferRequestValidation,
} from './validations/transaction.validation';
import { JoiValidationPipe } from '../pipes/joiValidationPipe';
import { ErrorsInterceptor } from '../shared/errors/interceptors';
import { Public } from '../auth/utils';

@Controller('transactions')
@UseInterceptors(ErrorsInterceptor)
export class TransactionsController {
  constructor(private transactionService: TransactionsService) {}

  @Get()
  async userTransactions(@Request() req) {
    return this.transactionService.getUserTransactions(req.user);
  }

  @HttpCode(200)
  @Post('transfer-fund')
  @UsePipes(new JoiValidationPipe(transferRequestValidation))
  async transferFunds(
    @Request() req,
    @Body() transferRequest: TransferRequestDto,
  ) {
    return this.transactionService.transferFunds(req.user, transferRequest);
  }

  @Post('fund-account')
  @UsePipes(new JoiValidationPipe(accountFundValidator))
  async fundAccount(@Request() req, @Body() body: FundAccountDto) {
    return this.transactionService.initializeAccountFunding(req.user, body);
  }

  @Public()
  @HttpCode(200)
  @Post('webhook')
  async verifyAccountFunding(@Request() req, @Body() body) {
    console.log(body);
    return 'received';
  }
}
