import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { CreateEmpresaUseCase } from 'src/application/Empresa/create.usecase';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/UpdateEmpresaDto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { FileValidatorUtil } from '../validator/validator-file';
import { GetAllEmpresaUseCase } from 'src/application/Empresa/get-all.usecase';
import { GetByIdEmpresaUseCase } from 'src/application/Empresa/get-by-id.usecase';
import { UpdateEmpresaUseCase } from 'src/application/Empresa/update.usecase';
import { generarCertificadoPrueba } from 'src/certificado/generarCertificadoPrueba';

//@UseGuards(JwtAuthGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(
    private readonly createUseCase: CreateEmpresaUseCase,
    private readonly getAllUseCase: GetAllEmpresaUseCase,
    private readonly getByIdUseCase: GetByIdEmpresaUseCase,
    private readonly updateUseCase: UpdateEmpresaUseCase,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificadoDigital', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: {
      certificadoDigital: Express.Multer.File[];
      logo: Express.Multer.File[];
    },
    @Body() body: CreateEmpresaDto,
  ) {
    const certificado = files.certificadoDigital?.[0];
    const logo = files.logo?.[0];
    FileValidatorUtil.validarCertificado(certificado);
    FileValidatorUtil.validarLogo(logo);
    body.certificadoDigital = certificado.buffer;
    body.logo = logo.buffer;
    body.certificadoNombreArchivo = certificado?.originalname
    return this.createUseCase.execute(body);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificadoDigital', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async update(
     @UploadedFiles()
    files: {
      certificadoDigital: Express.Multer.File[];
      logo: Express.Multer.File[];
    },
    @Param('id', ParseIntPipe) empresaId: number,
    @Body() body: UpdateEmpresaDto,
  ) {
    const certificado = files.certificadoDigital?.[0];
    const logo = files.logo?.[0];
    FileValidatorUtil.validarCertificado(certificado);
    FileValidatorUtil.validarLogo(logo);
    body.certificadoDigital = certificado.buffer;
    body.logo = logo.buffer;
    body.certificadoNombreArchivo = certificado?.originalname
    return this.updateUseCase.execute(body, empresaId);
  }
  @Get()
  async findAll() {
    return this.getAllUseCase.execute();
  }
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.getByIdUseCase.execute(id);
  }

  @Post('/generar-certificado-prueba')
  async generarCerticado(@Body() body: { numRuc: string; password: string }) {
    generarCertificadoPrueba(body.numRuc, body.password);
    return {
      data: true,
      message: 'Certificado generado',
    };
  }
}
