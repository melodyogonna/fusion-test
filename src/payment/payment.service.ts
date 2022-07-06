import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Transaction } from '@prisma/client';

import { PaymentDto } from './dto/payment.dto';
import { PrismaService } from '../shared/services/prisma.service';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { BadOperationError, ValueError } from '../shared/errors/errors';

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

  /**
   * Initialize payment to payment gateway.
   * @param paymentData
   */
  async initPayment(paymentData: PaymentDto) {
    try {
      const paymentRequest = this.httpService.post('/payments', paymentData, {
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

  verifyPayment(paymentId: string, transaction_amount: number) {
    const request = this.httpService.get(`${paymentId}/verify`, {
      baseURL: this.apiUrl,
    });
    return request.pipe(
      map((response) => {
        if (response.data.status === 'error') {
          throw new ValueError('Payment with id does not exist');
        }
        const data = response.data;
        if (data.status === 'successful' && data.amount >= transaction_amount) {
          return {
            tx_ref: data.tx_ref,
          };
        }
        throw new BadOperationError('Payment was not successful');
      }),
    );
  }
}
