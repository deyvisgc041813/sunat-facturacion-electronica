import { PartialType } from "@nestjs/mapped-types";
import { CreateEmpresaCredencialesDto } from "./create.credenciales-sunat.request.dto";

export class UpdateEmpresaCredencialesDto extends PartialType(CreateEmpresaCredencialesDto) {
    
}
