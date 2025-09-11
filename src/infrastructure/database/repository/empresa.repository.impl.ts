import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaMapper } from 'src/infrastructure/mapper/EmpresaMapper';
import { EmpresaRepository } from 'src/domain/empresa/Empresa.repository';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaOrmEntity } from '../entity/EmpresaOrmEntity';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/UpdateEmpresaDto';

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
