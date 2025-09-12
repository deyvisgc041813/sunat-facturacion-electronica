import { IsNotEmpty, IsString } from "class-validator";

export class FormaPagoDto {
  @IsString()
  @IsNotEmpty({ message: "Tipo moneda es obligatorio"})
  moneda: string;
  @IsString()
  @IsNotEmpty({ message: "Tipo de pago es obligatorio"})
  tipo: string;
  constructor(partial?: Partial<FormaPagoDto>) {
    Object.assign(this, partial);
  }
}
