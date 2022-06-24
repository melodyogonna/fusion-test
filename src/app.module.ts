import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    TransactionsModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
