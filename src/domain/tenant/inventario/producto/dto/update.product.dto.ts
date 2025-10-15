import { PartialType } from "@nestjs/mapped-types";
import { CreateProductoDto } from "./create.product.dto";
import { IsOptional } from "class-validator";


export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @IsOptional()
  producto_id?: number;
}
