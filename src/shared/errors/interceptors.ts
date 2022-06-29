import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  BadOperationError,
  EntityExistsError,
  EntityNotFoundError,
  ValueError,
} from './errors';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const badRequestErrors = [
          EntityNotFoundError,
          EntityExistsError,
          BadOperationError,
          ValueError,
        ];
        badRequestErrors.forEach((elem) => {
          if (err instanceof elem) {
            throw new BadRequestException(err.message);
          }
        });
        throw err;
      }),
    );
  }
}
