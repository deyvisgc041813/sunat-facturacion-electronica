import { Module } from '@nestjs/common';
import { ErrorLogRepositoryImpl } from './infrastructure/persistence/error-log/error-log.repository.impl';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLogOrmEntity } from './infrastructure/persistence/error-log/ErrorLogOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([ErrorLogOrmEntity])],
  controllers: [],
  providers: [ErrorLogRepositoryImpl],
  exports: [TypeOrmModule, ErrorLogRepositoryImpl],
})
export class ErrorLogModule {}
