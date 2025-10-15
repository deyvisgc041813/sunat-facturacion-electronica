import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // viene del JWT validado por AuthGuard

    if (user?.subDominio && user?.sucursalActiva > 0) {
      this.tenantContext.setSubDominio(user.subDominio);
      this.tenantContext.setSucursalId(user.sucursalActiva)
    }
    return true;
  }
}
