import { PartialType } from "@nestjs/mapped-types";
import { CreateProductoDto } from "./CreateProductoDto";
import { IsOptional } from "class-validator";


export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @IsOptional()
  producto_id?: number;
}
