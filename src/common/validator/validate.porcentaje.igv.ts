import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { TIPO_AFECTACION_EXONERADAS, TIPO_AFECTACION_GRAVADAS, TIPO_AFECTACION_INAFECTAS } from 'src/util/catalogo.enum';
import { TIPO_AFECTACION_IGV_VALIDATOR } from './validator.generico';

export function IsAfectacionIgvValida(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfectacionIgvValida',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const item = args.object as any;

          if (typeof value !== 'number') return false;

          // Gravadas → requieren IGV > 0
          if (
            TIPO_AFECTACION_GRAVADAS.includes(value) &&
            item.porcentajeIgv > 0
          ) {
            return true;
          }

          // Exoneradas / Inafectas / Exportación → requieren IGV = 0
          if (
            TIPO_AFECTACION_EXONERADAS.includes(value) ||
            (TIPO_AFECTACION_INAFECTAS.includes(value) &&
              item.porcentajeIgv === 0)
          ) {
            return true;
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          const item = args.object as any;
          const desc =
            TIPO_AFECTACION_IGV_VALIDATOR[args.value] || 'desconocido';

          if (TIPO_AFECTACION_GRAVADAS.includes(args.value)) {
            return `El tipo de afectación IGV ${args.value} (${desc}) requiere que porcentajeIgv sea mayor a 0 (ej. 18).`;
          }
          if (
            TIPO_AFECTACION_EXONERADAS.includes(args.value) ||
            TIPO_AFECTACION_INAFECTAS.includes(args.value)
          ) {
            return `El tipo de afectación IGV ${args.value} (${desc}) requiere que porcentajeIgv sea 0.`;
          }
          return `El tipo de afectación IGV ${args.value} no es válido según el catálogo SUNAT.`;
        },
      },
    });
  };
}
