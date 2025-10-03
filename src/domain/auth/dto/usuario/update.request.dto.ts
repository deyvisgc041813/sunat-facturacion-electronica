import { PartialType } from "@nestjs/mapped-types";
import { CreateUsuarioDto } from "./create.request.dto";
import { IsOptional } from "class-validator";

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsOptional()
  usuarioId?: number;
}
