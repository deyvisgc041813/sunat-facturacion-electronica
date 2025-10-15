import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './domain/parent/conecciones-database/service/tenant-context.service';

@Global()
@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantContextModule {}
