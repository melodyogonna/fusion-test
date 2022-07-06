export class PaymentDto {
  customer: CustomerDetail;
  amount: number;
  currency: string;
  tx_ref: string;
  meta?: Record<string, unknown>;
  redirect_url: string;
}
class CustomerDetail {
  email: string;
  name?: string;
  phone?: string;
}
