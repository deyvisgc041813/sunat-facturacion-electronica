import { UbigeoService } from "src/domain/ubigeo/services/ubigeo.service";


export class GetDistrictUseCase {
  constructor(private readonly ubigeoService: UbigeoService) {}

  async execute(provinciaId: number) {
    return await this.ubigeoService.getDistrictByProvince(provinciaId);
  }
}