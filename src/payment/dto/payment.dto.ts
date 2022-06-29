export class PaymentDto {
  email: string;
  amount: number;
  currency: string;
  meta?: Record<string, unknown>;
  userId: string;
}
