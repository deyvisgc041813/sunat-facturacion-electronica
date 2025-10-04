import { PartialType } from "@nestjs/mapped-types";
import { CreateEmpresaDto } from "./CreateEmpresaDto";

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {}
