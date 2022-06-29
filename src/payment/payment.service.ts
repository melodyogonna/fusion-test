import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PaymentDto } from './dto/payment.dto';
import { PrismaService } from '../shared/services/prisma.service';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class PaymentService {
  private apiUrl: string;
  constructor(
    private httpService: HttpService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.apiUrl = 'https://api.flutterwave.com/v3';
  }

  async initPayment(paymentData: PaymentDto) {
    const transaction = await this.prismaService.transaction.create({
      data: {
        user: {
          connect: { id: paymentData.userId },
        },
        amount: paymentData.amount,
        type: 'CREDIT',
      },
    });
    const requestData = {
      email: paymentData.email,
      tx_ref: transaction.id,
      currency: paymentData.currency,
      amount: paymentData.amount,
      meta: paymentData.meta,
    };
    try {
      const paymentRequest = this.httpService.post('/payments', requestData, {
        baseURL: this.apiUrl,
        headers: {
          Authorization: 'Bearer ' + this.configService.get('FLW_SECRET_KEY'),
        },
      });
      return {
        data: await lastValueFrom(
          paymentRequest.pipe(map((response) => response.data.data)),
        ),
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  verifyPayment(paymentId: number) {
    return;
  }
}
