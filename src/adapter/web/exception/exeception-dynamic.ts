import { HttpException, HttpStatus } from '@nestjs/common';
interface IBusinessError {
  success: boolean;
  statusCode: number;
  message: string | string[];
  errors: any
}

export class BusinessLogicException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class BusinessLogicObjectException extends HttpException {
  constructor(error: IBusinessError) {
    super(error, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}