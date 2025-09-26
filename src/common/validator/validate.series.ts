import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';

export function IsSerieValida(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSerieValida',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const tipoComprobante = (args.object as any)[relatedPropertyName];

          if (typeof value !== 'string') return false;
          const regex = getSerieRegex(tipoComprobante);
          return regex ? regex.test(value) : false;
        },
        defaultMessage(args: ValidationArguments) {
          const tipoComprobante = (args.object as any)[args.constraints[0]];
          switch (tipoComprobante) {
            case TipoComprobanteEnum.FACTURA:
              return 'La serie para Factura debe tener formato F001, F002...';
            case TipoComprobanteEnum.BOLETA:
              return 'La serie para Boleta debe tener formato B001, B002...';
            case TipoComprobanteEnum.NOTA_CREDITO:
              return 'La serie para Nota de Crédito debe tener formato FC01, FC02...';
            case TipoComprobanteEnum.NOTA_DEBITO:
              return 'La serie para Nota de Débito debe tener formato FD01, FD02...';
            default:
              return 'Serie no válida';
          }
        },
      },
    });
  };
}

export function getSerieRegex(tipo: TipoComprobanteEnum): RegExp | null {
  switch (tipo) {
    case TipoComprobanteEnum.FACTURA:
      return /^F\d{3}$/;      // Factura → F001, F002...
    case TipoComprobanteEnum.BOLETA:
      return /^B\d{3}$/;      // Boleta → B001, B002...
    case TipoComprobanteEnum.NOTA_CREDITO:
      return /^FC\d{2}$/;     // Nota de Crédito Factura → FC01, FC02...
    case TipoComprobanteEnum.NOTA_DEBITO:
      return /^FD\d{2}$/;     // Nota de Débito Factura → FD01, FD02...
    default:
      return null;
  }
}