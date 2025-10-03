import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { User } from 'src/adapter/decorator/user.decorator';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateUsersUseCase } from 'src/application/admin/usuario/create-users.usecase';
import { GetUsuarioByIdUseCase } from 'src/application/admin/usuario/get-users-by-id.usecase';
import { GetUsersUseCase } from 'src/application/admin/usuario/get-users.usecase';
import { UpdateUsersUseCase } from 'src/application/admin/usuario/update-users.usecase';
import { CreateUsuarioDto } from 'src/domain/auth/dto/usuario/create.request.dto';
import { UpdateUsuarioDto } from 'src/domain/auth/dto/usuario/update.request.dto';

@Controller('branch/auth/users')
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(private readonly createUseCase: CreateUsersUseCase, 
    private readonly updateUseCase: UpdateUsersUseCase,
    private readonly getUseCase: GetUsersUseCase,
    private readonly getByIdUseCase:GetUsuarioByIdUseCase
  ) {}
  //@SetMetadata('roles', ['Administrador'])
  @Post()
  create(@Body() dto: CreateUsuarioDto, @User() user: any) {
    try {
      const result = this.createUseCase.execute(dto, user?.empresaId);
      return result;
    } catch (error) {
      console.error('Error en create:', error);
      throw error; 
    }
  }

  @Get()
  findAll(@User() auth: IUserPayload) {
    return this.getUseCase.execute(auth.sucursalActiva);
  }
  @Get(':id')
  findOne(@Param('id') id:number, @User() auth: IUserPayload) {
    return this.getByIdUseCase.execute(auth.sucursalActiva, id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: UpdateUsuarioDto, @User() auth: IUserPayload) {
    return this.updateUseCase.execute(body, id, auth);
  }

  // @Delete(':id')
  // remove(@Param('id') id: number) {
  //   return this.usuarioService.remove(+id);
  // }
}
