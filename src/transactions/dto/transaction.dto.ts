export class TransferRequestDto {
  recipientEmail: string;
  amount: number;
}

export class FundAccountDto {
  amount: number;
  redirect_url: string;
}
