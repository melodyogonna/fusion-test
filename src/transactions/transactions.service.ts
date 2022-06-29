import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../shared/services/prisma.service';
import { TransferRequestDto } from './dto/transaction.dto';
import {
  BadOperationError,
  EntityNotFoundError,
} from '../shared/errors/errors';

@Injectable()
export class TransactionsService {
  constructor(private prismaService: PrismaService) {}

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
  async initializeAccountFunding(user, amount: number) {}
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
}
