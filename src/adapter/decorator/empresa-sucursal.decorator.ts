// empresa-sucursal.decorator.ts
import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

export const EmpresaSucursal = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const sucursalId = req.body?.sucursalId;
    // Validar que la sucursal existe en el array del token
    if (!user.sucursales.includes(Number(sucursalId))) {
      throw new ForbiddenException(
        `La sucursal con ID ${sucursalId} no está autorizada para este usuario`,
      );
    }

    return {
      empresaId: user.empresaId,
      sucursalId: Number(sucursalId),
      roles: user.roles,
      userId: user.userId
    };
  },
);
