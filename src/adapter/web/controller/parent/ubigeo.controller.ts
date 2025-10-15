import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { GetDepartamentUseCase } from 'src/application/parent/ubigeo/get-departament.usecase';
import { GetDistrictUseCase } from 'src/application/parent/ubigeo/get-district.usecase';
import { GetProvinceUseCase } from 'src/application/parent/ubigeo/get-province.usecase';

@Controller('companies/ubigeo')
@UseGuards(JwtAuthGuard)
export class UbigeoController {
  constructor(private readonly getDepartamentUseCase: GetDepartamentUseCase, 
    private readonly getProvinceUseCase: GetProvinceUseCase,
    private readonly getDistritoUseCase:GetDistrictUseCase
  ) {}
  @Get("departament")
  getDepartament() {
    return this.getDepartamentUseCase.execute();
  }
  @Get("province/:departamentId")
  getProvince(@Param('departamentId') departamentId:number) {
    return this.getProvinceUseCase.execute(departamentId);
  }

  @Get("district/:provinceId")
  getDistrict(@Param('provinceId') provinceId:number) {
    return this.getDistritoUseCase.execute(provinceId);
  }
}
