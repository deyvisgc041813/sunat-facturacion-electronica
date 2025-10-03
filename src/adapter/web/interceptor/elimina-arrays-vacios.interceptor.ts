import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class EliminaArraysVaciosInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.removeEmptyArrays(data)),
    );
  }

  private removeEmptyArrays(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyArrays(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key]) && obj[key].length === 0) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          obj[key] = this.removeEmptyArrays(obj[key]);
        }
      });
    }
    return obj;
  }
}
