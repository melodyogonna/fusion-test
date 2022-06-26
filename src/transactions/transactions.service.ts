import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../shared/services/prisma.service';
import { TransferRequestDto } from './dto/transaction.dto';
import { BadOperationError } from '../shared/errors/errors';

@Injectable()
export class TransactionsService {
  constructor(private prismaService: PrismaService) {}

  async transferFunds(user: User, transferRequest: TransferRequestDto) {
    // Balance in request object might be outdated, always get up to date balance from db
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
      await this.prismaService.$transaction(async (prisma: PrismaService) => {
        const updateSenderBalance = await prisma.user.update({
          data: { balance: { decrement: transferRequest.amount } },
          where: { id: user.id },
        });
        const updateRecipientBalance = await prisma.user.update({
          data: { balance: { increment: transferRequest.amount } },
          where: { email: transferRequest.recipientEmail },
        });

        const recipientTrx = await prisma.transaction.create({
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
        console.log(senderTrx);

        return { data: { ...senderTrx } };
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  async initializeAccountFunding(user, amount: number) {}
}
