import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EntityExistsError, EntityNotFoundError, ValueError } from './errors';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof EntityNotFoundError) {
          throw new BadRequestException(err.message);
        } else if (err instanceof EntityExistsError) {
          throw new BadRequestException(err.message);
        } else if (err instanceof ValueError) {
          throw new BadRequestException(err.message);
        } else {
          throw err;
        }
      }),
    );
  }
}
