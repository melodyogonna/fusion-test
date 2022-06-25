export class TransferRequestDto {
  recipientEmail: string;
  amount: number;
}

export class FundAccountDto {
  amount: number;
  cardNumber: number;
  cardCvv: number;
  cardExpiry: string;
}
