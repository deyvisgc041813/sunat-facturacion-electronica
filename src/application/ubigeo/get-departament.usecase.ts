import { UbigeoService } from "src/domain/ubigeo/services/ubigeo.service";


export class GetDepartamentUseCase {
  constructor(private readonly ubigeoService: UbigeoService) {}

  async execute() {
    return await this.ubigeoService.getDepartament();
  }
}