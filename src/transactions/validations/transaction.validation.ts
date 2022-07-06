import * as joi from 'joi';

export const transferRequestValidation = joi.object({
  recipientEmail: joi.string().email().required(),
  amount: joi.number().min(10).required(),
});

export const accountFundValidator = joi.object({
  amount: joi.number().min(10).required(),
  redirect_url: joi.string().uri().required(),
});
