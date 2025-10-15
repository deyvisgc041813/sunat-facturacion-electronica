import { DepartamentoResponseDto, DistritoResponseDto, ProvinciaResponseDto } from "../dto/ubigeo.response";

export interface IUbigeoRepositoryPort {
  getDepartament(): Promise<DepartamentoResponseDto[]>;
  getProvinceByDepartament(departamentoId: number): Promise<ProvinciaResponseDto[]>;
  getDistrictByProvince(provinciaId: number): Promise<DistritoResponseDto[]>;
  getDistrictById(distritoId: number): Promise<DistritoResponseDto | null>
}