import { TenantContextService } from "src/domain/parent/conecciones-database/service/tenant-context.service";
import { TenantRepositoryHelper } from "src/domain/parent/conecciones-database/service/tenant-repository.helper";


export abstract class BaseTenantRepository<T> {
  protected repository;

  constructor(
    protected readonly tenantContext: TenantContextService,
    protected readonly tenantRepositoryHelper: TenantRepositoryHelper,
    private readonly entity: new () => T,
  ) {}

  protected async getRepository() {
    if (!this.repository) {
      const subDominio = this.tenantContext.getSubDominio() ?? '';
      const sucursalId = this.tenantContext.getSucursalId()

      this.repository = await this.tenantRepositoryHelper.getTenantRepository(subDominio, this.entity, sucursalId);
    }
    return this.repository;
  }
}
