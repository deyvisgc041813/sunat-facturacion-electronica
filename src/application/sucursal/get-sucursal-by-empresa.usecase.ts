import { UnauthorizedException } from '@nestjs/common';
import { SucursalResponseDto } from 'src/domain/sucursal/dto/sucursal.response.dto';
import { SucursalService } from 'src/domain/sucursal/service/sucursal.service';
export class GetSucursalByEmpresaIdUseCase {
  constructor(private readonly sucursalService: SucursalService) {}
  async execute(
    sucursalId: number,
    empresaId: number,
  ): Promise<SucursalResponseDto[]> {
    if (!empresaId || empresaId <= 0) {
      throw new UnauthorizedException(
        'Tu sesión no tiene una empresa asociada. Vuelve a iniciar sesión para continuar.',
      );
    }
    return this.sucursalService.getById(sucursalId, empresaId);
  }
}
