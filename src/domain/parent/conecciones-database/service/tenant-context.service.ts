
import { Injectable, Scope } from '@nestjs/common';
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private subDominio: string;
  private sucursalId:number

  setSubDominio(subDominio: string) {
    this.subDominio = subDominio;
  }

  getSubDominio(): string {
    return this.subDominio;
  }
  
  setSucursalId(sucursalId: number) {
    this.sucursalId = sucursalId;
  }

  getSucursalId(): number {
    return this.sucursalId;
  }
}
