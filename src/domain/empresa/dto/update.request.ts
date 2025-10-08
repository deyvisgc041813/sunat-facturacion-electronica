import { PartialType } from "@nestjs/mapped-types";
import { CreateEmpresaDto } from "./create.request.dto";

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {}
