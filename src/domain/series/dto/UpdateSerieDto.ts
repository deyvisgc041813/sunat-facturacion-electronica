import { PartialType } from "@nestjs/mapped-types";

import { IsOptional } from "class-validator";
import { CreateSerieDto } from "./CreateSerieDto";


export class UpdateSerieDto extends PartialType(CreateSerieDto) {
  @IsOptional()
  serieId?: number;
  @IsOptional()
  usuarioId?: number;
  @IsOptional()
  motivo?: string;
  @IsOptional()
  newCorrelativo?:number;
}
