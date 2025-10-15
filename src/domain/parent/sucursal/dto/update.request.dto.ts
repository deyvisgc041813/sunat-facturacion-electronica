import { PartialType } from "@nestjs/mapped-types";
import { CreateSucursalDto } from "./create.request.dto";

export class UpdateSucursalDto extends PartialType(CreateSucursalDto) {}
