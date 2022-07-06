import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../shared/services/prisma.service';
import { FundAccountDto, TransferRequestDto } from './dto/transaction.dto';
import {
  BadOperationError,
  EntityNotFoundError,
  ValueError,
} from '../shared/errors/errors';
import { PaymentService } from '../payment/payment.service';
import { map } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class TransactionsService {
  constructor(
    private prismaService: PrismaService,
    private paymentService: PaymentService,
  ) {}

  /**
   * Transfer fund from user to user.
   * @param user
   * @param transferRequest
   */
  async transferFunds(user: User, transferRequest: TransferRequestDto) {
    const recipient = await this.prismaService.user.findUnique({
      where: { email: transferRequest.recipientEmail },
    });
    if (!recipient) {
      throw new EntityNotFoundError('Recipient with email does not exist');
    }
    // Balance in request object might be stale, always get up-to-date balance from db
    const updatedUserBalance = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: { id: true, balance: true },
    });
    if (
      updatedUserBalance &&
      transferRequest.amount > updatedUserBalance.balance
    ) {
      throw new BadOperationError(
        'Insufficient balance for requested operation',
      );
    }

    try {
      const transfer = await this.initializeFundTransfer(user, transferRequest);
      return { data: transfer };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  private async initializeFundTransfer(
    user: User,
    transferRequest: TransferRequestDto,
  ) {
    return await this.prismaService.$transaction(
      async (prisma: PrismaService) => {
        const updateSenderBalance = await prisma.user.update({
          data: { balance: { decrement: transferRequest.amount } },
          where: { id: user.id },
        });
        const updateRecipientBalance = await prisma.user.update({
          data: { balance: { increment: transferRequest.amount } },
          where: { email: transferRequest.recipientEmail },
        });

        await prisma.transaction.create({
          data: {
            type: 'CREDIT',
            status: 'SUCCESSFUl',
            amount: transferRequest.amount,
            userId: updateRecipientBalance.id,
          },
        });

        const senderTrx = await prisma.transaction.create({
          data: {
            type: 'DEBIT',
            status: 'SUCCESSFUl',
            amount: transferRequest.amount,
            userId: updateSenderBalance.id,
          },
        });
        return senderTrx;
      },
    );
  }

  async getUserTransactions(user: User) {
    const transactions = await this.prismaService.transaction.findMany({
      where: { userId: user.id },
    });
    return { data: transactions };
  }

  async initializeAccountFunding(user: User, detail: FundAccountDto) {
    const transaction = await this.prismaService.transaction.create({
      data: {
        user: {
          connect: { id: user.id },
        },
        amount: detail.amount,
        type: 'CREDIT',
      },
    });
    const paymentData = {
      customer: {
        email: user.email,
      },
      tx_ref: transaction.id,
      currency: 'NGN',
      ...detail,
    };
    const initPayment = await this.paymentService.initPayment(paymentData);
    return { data: initPayment.data };
  }

  async verifyPaymentTransaction(
    user: User,
    paymentId: string,
    tx_ref: string,
  ) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id: tx_ref },
    });
    if (!transaction) {
      throw new BadOperationError('Transaction does not exist on database');
    }
    return this.paymentService
      .verifyPayment(paymentId, transaction.amount)
      .pipe(
        map(async (value) => {
          await this.prismaService.$transaction([
            this.prismaService.transaction.update({
              data: { status: 'SUCCESSFUl' },
              where: { id: value.tx_ref },
            }),
            this.prismaService.user.update({
              data: { balance: { increment: transaction.amount } },
              where: { id: user.id },
            }),
          ]);
          return { message: 'Transaction has been verified as successful.' };
        }),
        catchError(async (err) => {
          if (err instanceof BadOperationError) {
            await this.prismaService.transaction.update({
              data: { status: 'FAILED' },
              where: { id: transaction.id },
            });
            return { message: 'Transaction verified as unsuccessful.' };
          }
          throw err;
        }),
      );
  }
}
