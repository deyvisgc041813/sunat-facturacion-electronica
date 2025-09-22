import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaMapper } from 'src/domain/mapper/EmpresaMapper';
import { EmpresaRepository } from 'src/domain/empresa/Empresa.repository';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaOrmEntity } from './EmpresaOrmEntity';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/UpdateEmpresaDto';
import { GetCertificadoDto } from 'src/domain/empresa/dto/GetCertificadoDto';

@Injectable()
export class EmpresaRepositoryImpl implements EmpresaRepository {
  constructor(
    @InjectRepository(EmpresaOrmEntity) private readonly repo: Repository<EmpresaOrmEntity>,
  ) {}
  
  async save( empresa: CreateEmpresaDto): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
    const newEmpresa = await this.repo.save(EmpresaMapper.dtoToOrmCreate(empresa));
    return {
      status: true,
      message: 'Cliente registrado correctamente',
      data: EmpresaMapper.toDomain(newEmpresa),
    };
  }

  async findAll(): Promise<EmpresaResponseDto[]> {
    const result = await this.repo.find({
      relations: ['clientes', 'productos']
    });
    return result.map((empresa) => EmpresaMapper.toDomain(empresa));
  }

  async findById(id: number): Promise<EmpresaResponseDto | null> {
    const empresa = await this.repo.findOne({
      where: { empresaId: id },
      relations: ['clientes', 'productos'],
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa con id ${id} no encontrado`);
    }
    return EmpresaMapper.toDomain(empresa);
  }
  async findCertificado(ruc: string): Promise<GetCertificadoDto | null> {
    const empresa = await this.repo.findOne({ where: { ruc } });

    if (!empresa) {
      throw new NotFoundException(`No se encontró empresa con RUC ${ruc}`);
    }
    if (!empresa.certificadoDigital) {
      throw new NotFoundException(`La empresa ${ruc} no tiene certificado digital registrado`);
    }
    const certificado = new GetCertificadoDto(empresa.empresaId, empresa.certificadoDigital, empresa.claveCertificado ?? "")
    return certificado;
  }


  async update(empresa: UpdateEmpresaDto, empresaId:number): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
    const empresaUpdate = EmpresaMapper.dtoToOrmUpdate(empresa);
    empresaUpdate.empresaId = empresaId
    const clientUpdate = await this.repo.save(empresaUpdate);
    return {
      status: true,
      message: 'Actualizado correctamente',
      data:  EmpresaMapper.toDomain(clientUpdate)
    };
  }
}
