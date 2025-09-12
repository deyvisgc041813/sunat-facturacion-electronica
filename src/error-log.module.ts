import { Module } from '@nestjs/common';
import { ErrorLogRepositoryImpl } from './infrastructure/database/repository/error-log.repository.impl';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLogOrmEntity } from './infrastructure/database/entity/ErrorLogOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([ErrorLogOrmEntity])],
  controllers: [],
  providers: [ErrorLogRepositoryImpl],
  exports: [TypeOrmModule, ErrorLogRepositoryImpl],
})
export class ErrorLogModule {}
