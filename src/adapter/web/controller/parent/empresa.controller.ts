import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateEmpresaUseCase } from 'src/application/parent/empresa/create.empresa.usecase';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { GetAllEmpresaUseCase } from 'src/application/parent/empresa/get-all.empresa.usecase';
import { GetByIdEmpresaUseCase } from 'src/application/parent/empresa/get-by-id.empresa.usecase';
import { GetByRucEmpresaUseCase } from 'src/application/parent/empresa/get-by-ruc.empresa.usecase';
import { UpdateEmpresaUseCase } from 'src/application/parent/empresa/update.empresa.usecase';
import { generarCertificadoPrueba } from 'src/certificado/generarCertificadoPrueba';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { User } from 'src/adapter/decorator/user.decorator';
import { DeleteEmpresaUseCase } from 'src/application/parent/empresa/delete.empresa.usecase';
import { UpdateStatusEmpresaUseCase } from 'src/application/parent/empresa/update-status.empresa.usecase';
import { CreateEmpresaDto } from 'src/domain/parent/empresa/dto/create.request.dto';
import { UpdateEmpresaDto } from 'src/domain/parent/empresa/dto/update.request';
import { FileValidatorUtil } from '../../validator/validator-file';
import { CreateEmpresaOnboardingDto } from 'src/domain/parent/empresa/dto/create.request.onboarding.dto';
import { CreateEmpresaBoardingUseCase } from 'src/application/parent/empresa/create.empresa-boarding.usecase';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class EmpresaController {
  constructor(
    private readonly createUseCase: CreateEmpresaUseCase,
    private readonly getAllUseCase: GetAllEmpresaUseCase,
    private readonly getByIdUseCase: GetByIdEmpresaUseCase,
    private readonly getByRucUseCase: GetByRucEmpresaUseCase,
    private readonly updateUseCase: UpdateEmpresaUseCase,
    private readonly deleteUseCase: DeleteEmpresaUseCase,
    private readonly updateStatusUseCase: UpdateStatusEmpresaUseCase,
    private readonly createBoardingUseCase: CreateEmpresaBoardingUseCase,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificado_digital', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: {
      certificado_digital: Express.Multer.File[];
      logo: Express.Multer.File[];
    },
    @Body() body: CreateEmpresaDto,
    @User() auth: IUserPayload,
  ) {
    console.log("body ", body)
    const certificado = files.certificado_digital?.[0];
    const logo = files.logo?.[0];
    FileValidatorUtil.validarCertificado(certificado);
    FileValidatorUtil.validarLogo(logo);
    body.certificado_digital = certificado.buffer;
    body.logo = logo.buffer;
    body.certificadoNombreArchivo = certificado?.originalname;
    return this.createUseCase.execute(body, auth);
  }
  @Post("boarding")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificado_digital', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async createBoarding(
    @UploadedFiles()
    files: {
      certificado_digital: Express.Multer.File[];
      logo: Express.Multer.File[];
    },
    @Body() body: CreateEmpresaOnboardingDto,
    @User() auth: IUserPayload,
  ) {
    console.log("certificado_digital ", files)
    const certificado = files.certificado_digital?.[0];
    const logo = files.logo?.[0];
    FileValidatorUtil.validarCertificado(certificado);
    FileValidatorUtil.validarLogo(logo);
    body.certificado_digital = certificado.buffer;
    body.logo = logo.buffer;
    body.certificadoNombreArchivo = certificado?.originalname;
    return this.createBoardingUseCase.execute(body, auth);
  }
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificado_digital', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async update(
    @UploadedFiles()
    files: {
      certificado_digital: Express.Multer.File[];
      logo: Express.Multer.File[];
    },
    @Param('id', ParseIntPipe) empresaId: number,
    @Body() body: UpdateEmpresaDto,
    @User() auth: IUserPayload,
  ) {
    const certificado = files.certificado_digital?.[0];
    const logo = files.logo?.[0];
    FileValidatorUtil.validarCertificado(certificado);
    FileValidatorUtil.validarLogo(logo);
    body.certificado_digital = certificado.buffer;
    body.logo = logo.buffer;
    body.certificadoNombreArchivo = certificado?.originalname;
    return this.updateUseCase.execute(body, empresaId, auth);
  }
  @Get()
  async findAll() {
    return this.getAllUseCase.execute();
  }
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.getByIdUseCase.execute(id);
  }

  @Get('/ruc/:ruc')
  async findByRuc(@Param('ruc', ParseIntPipe) ruc: string) {
    return this.getByRucUseCase.execute(ruc);
  }

  @Post('/generar-certificado-prueba')
  async generarCerticado(@Body() body: { numRuc: string; password: string }) {
    generarCertificadoPrueba(body.numRuc, body.password);
    return {
      data: true,
      message: 'Certificado generado',
    };
  }
  @Delete(':id')
  async delete(
    @Param('id') id: number,
    @User() auth: IUserPayload,
  ): Promise<any> {
    return await this.deleteUseCase.execute(id, auth);
  }
  @Patch(':id/status/:estado')
  async toggleStatus(
    @Param('id') id: number,
    @Param('estado') estado: string,
    @User() auth: IUserPayload,
  ) {
    return await this.updateStatusUseCase.execute(id, estado, auth);
  }
}
