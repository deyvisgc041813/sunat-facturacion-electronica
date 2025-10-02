import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  SetMetadata,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateUsuarioDto } from 'src/domain/auth/dto/usuario/create.request.dto';
import { UsuarioService } from 'src/domain/auth/services/usuario.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}
  //@SetMetadata('roles', ['Administrador'])
  @Post()
  create(@Body() dto: CreateUsuarioDto, @Req() req) {

    try {
      const result = this.usuarioService.create(dto);
      console.log('Creación exitosa:', result);
      return result;
    } catch (error) {
      console.error('Error en create:', error);
      throw error; 
    }
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usuarioService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: number, @Body() dto: any) {
  //   return this.usuarioService.update(+id, dto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: number) {
  //   return this.usuarioService.remove(+id);
  // }
}
