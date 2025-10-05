import { UbigeoService } from "src/domain/ubigeo/services/ubigeo.service";


export class GetProvinceUseCase {
  constructor(private readonly ubigeoService: UbigeoService) {}

  async execute(departamentoId: number) {
    return await this.ubigeoService.getProvinceByDepartament(departamentoId);
  }
}