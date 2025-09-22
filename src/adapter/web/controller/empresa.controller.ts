import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { CreateEmpresaUseCase } from 'src/application/Empresa/CreateEmpresaUseCase';
import { FindAllEmpresaUseCase } from 'src/application/Empresa/FindAllEmpresaUseCase';
import { FindByIdEmpresaUseCase } from 'src/application/Empresa/FindByIdEmpresaUseCase';
import { UpdateEmpresaUseCase } from 'src/application/Empresa/UpdateEmpresaUseCase';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/UpdateEmpresaDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';


@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaRepo: EmpresaRepositoryImpl) {}

  @Post()
  @UseInterceptors(FileInterceptor("certificadoDigital"))
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: CreateEmpresaDto) {
    body.certificadoDigital = file.buffer
    const useCase = new CreateEmpresaUseCase(this.empresaRepo);
    return useCase.execute(body);
  }
  @Get()
  async findAll() {
    const useCase = new FindAllEmpresaUseCase(this.empresaRepo)
    return useCase.execute();
  }
  @Get(":id")
  async findById(@Param("id", ParseIntPipe) id:number) {
    const useCase = new FindByIdEmpresaUseCase(this.empresaRepo)
    return useCase.execute(id);
  }
  @Put(":id")
  async update(@Param("id", ParseIntPipe) empresaId:number, @Body() body: UpdateEmpresaDto) {
    const useCase = new UpdateEmpresaUseCase(this.empresaRepo)
    return useCase.execute(body, empresaId);
  }
}
