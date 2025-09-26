// utils/catalogo-validator.ts
import { ValidationArguments } from 'class-validator';

export function buildCatalogValidator<T extends Record<number | string, string>>(catalog: T) {
  return {
    values: Object.keys(catalog).map((k) =>
      isNaN(Number(k)) ? k : Number(k) // convierte números en number, strings en string
    ),
    message: (args: ValidationArguments) => {
      const lista = Object.entries(catalog)
        .map(([codigo, desc]) => `${codigo} (${desc})`)
        .join(', ');
      return `El valor '${args.value}' no es válido. Valores permitidos: ${lista}.`;
    },
  };
}

export const TIPO_AFECTACION_IGV_VALIDATOR: Record<number, string> = {
  10: 'Gravado - Onerosa',
  11: 'Gravado - Retiro por premio',
  12: 'Gravado - Retiro por donación',
  13: 'Gravado - Retiro',
  14: 'Gravado - Retiro por publicidad',
  15: 'Gravado - Bonificaciones',
  16: 'Gravado - Retiro por entrega a trabajadores',
  17: 'Gravado - IVAP',
  20: 'Exonerado - Onerosa',
  21: 'Exonerado - Transferencia gratuita',
  30: 'Inafecto - Onerosa',
  31: 'Inafecto – Retiro por Bonificación',
  32: 'Inafecto - Retiro',
  33: 'Inafecto – Retiro por Muestras Médicas',
  34: 'Inafecto - Retiro por Convenio Colectivo',
  35: 'Inafecto – Retiro por premio',
  36: 'Inafecto - Retiro por publicidad',
  37: 'Inafecto - Transferencia gratuita',
  40: 'Exportación de Bienes o Servicios',
};
