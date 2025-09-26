import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class FormaPagoDto {
  @IsString({ message: 'El tipo de moneda debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de moneda es obligatorio' })
  @IsIn(['PEN', 'USD'], { message: 'La moneda debe ser PEN o USD' })
  tipoMoneda: string;
  
  @IsString()
  @IsNotEmpty({ message: 'Tipo de pago es obligatorio' })
  @IsIn(['Contado', 'Crédito'], { message: 'Tipo de pago debe ser Contado o Crédito' })
  tipo: string;

  @IsString({ message: 'La forma de pago debe ser un texto' })
  @IsNotEmpty({ message: 'La forma de pago es obligatoria' })
  @IsIn(['Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin'], {
    message: "Forma de pago no válida. Valores permitidos: 'Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin'."
  })
  medioPago: string;
  constructor(partial?: Partial<FormaPagoDto>) {
    Object.assign(this, partial);
  }
}
