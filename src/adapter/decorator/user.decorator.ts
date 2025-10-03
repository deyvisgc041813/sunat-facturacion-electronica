// // user.decorator.ts
// import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// export const User = createParamDecorator(
//   (data: unknown, ctx: ExecutionContext) => {
//     const request = ctx.switchToHttp().getRequest();
//     return request.user;
//   },
// );

// user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserPayload } from './user.decorator.interface';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    const payload = request.user; // asumimos que aquí está el JWT decodificado
    return {
      userId: payload.userId,
      empresaId: payload.empresaId,
      correo: payload.correo,
      nombre: payload.nombre,
      sucursalActiva: payload.sucursalActiva,
      roles: payload.roles,
      sucursales: payload.sucursales,
    };
  },
);