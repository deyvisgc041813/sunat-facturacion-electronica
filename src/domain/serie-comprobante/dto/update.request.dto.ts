import { PartialType } from "@nestjs/mapped-types";

import { IsOptional } from "class-validator";
import { CreateSerieDto } from "./create.request.dto";


export class UpdateSerieDto extends PartialType(CreateSerieDto) {
  @IsOptional()
  usuarioModificacion:string
  @IsOptional()
  newCorrelativo?:number;
  @IsOptional()
  motivo:string
}
