import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    AuthModule,
    TransactionsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PaymentModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
