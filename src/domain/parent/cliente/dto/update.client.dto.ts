import { PartialType } from "@nestjs/mapped-types";
import { CreateClienteDto } from "./create.client.dto";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  @IsOptional()
  clienteId?: number;
}
