import { PartialType } from "@nestjs/mapped-types";

import { IsOptional } from "class-validator";
import { CreateSerieAuditoriaDto } from "./CreateSerieAuditoriaDto";


export class UpdateSerieAuditoriaDto extends PartialType(CreateSerieAuditoriaDto) {
  @IsOptional()
  serieAuditoriaId?: number;
}
