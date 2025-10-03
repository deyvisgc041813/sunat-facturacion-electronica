// 🔹 Operaciones Gravadas (con IGV, precio normal)
export const TIPO_AFECTACION_GRAVADAS: number[] = [
  10, // Gravado - Onerosa
  11, // Gravado - Retiro por premio
  12, // Gravado - Retiro por donación
  13, // Gravado - Retiro
  14, // Gravado - Retiro por publicidad
  15, // Gravado - Bonificaciones
  16, // Gravado - Retiro por entrega a trabajadores
  17, // Gravado - IVAP
];
// 🔹 Operaciones Exoneradas
export const TIPO_AFECTACION_EXONERADAS: number[] = [
  20, // Exonerado - Onerosa,
  21, // Exonerado - Transferencia gratuita
];

// 🔹 Operaciones Inafectas
export const TIPO_AFECTACION_INAFECTAS: number[] = [
  30, // Inafecto - Onerosa
  31, // Inafecto – Retiro por Bonificación
  32, // Inafecto - Retiro
  33, // Inafecto – Retiro por Muestras Médicas
  34, // Inafecto - Inafecto - Retiro por Convenio Colectivo
  35, // Inafecto – Retiro por premio
  36, // Inafecto - Retiro por publicidad
  37, // Inafecto - Transferencia gratuita
  40, // Inafecto - Exportación de Bienes o Servicios
];

// 🔹 Operaciones de Exportación
export const TIPO_AFECTACION_EXPORTACION: number[] = [
  40, // Exportación
];

// 🔹 Operaciones Gratuitas
export const TIPO_AFECTACION_GRATUITAS: number[] = [
  21, // Exonerado - Transferencia gratuita
  31, // Inafecto - Transferencia gratuita
  // NOTA: también se consideran "gratuitas" algunas del bloque 11-16 cuando el precio es 0
];

// Catálogo de tributos SUNAT
export const MAP_TRIBUTOS: Record<
  string,
  { id: string; name: string; taxTypeCode: string }
> = {
  IGV: { id: '1000', name: 'IGV', taxTypeCode: 'VAT' },
  ICBPER: { id: '7152', name: 'ICBPER', taxTypeCode: 'OTH' },
  EXO: { id: '9997', name: 'EXO', taxTypeCode: 'VAT' },
  INA: { id: '9998', name: 'INA', taxTypeCode: 'FRE' },
  MORA: { id: 'TIM2025', name: 'MOTA', taxTypeCode: 'MORA' },
};

export const TRIBUTOS_RESUMEN = [
  {
    key: 'mtoOperGravadas',
    id: '1000',
    name: 'IGV',
    taxTypeCode: 'VAT',
    instructionID: '01',
    conIgv: true,
  },
  {
    key: 'mtoOperExoneradas',
    id: '9997',
    name: 'EXO',
    taxTypeCode: 'VAT',
    instructionID: '02',
    conIgv: false,
  },
  {
    key: 'mtoOperInafectas',
    id: '9998',
    name: 'INA',
    taxTypeCode: 'VAT',
    instructionID: '03',
    conIgv: false,
  },
  {
    key: 'mtoOperExportacion',
    id: '9995',
    name: 'EXP',
    taxTypeCode: 'VAT',
    instructionID: '04',
    conIgv: false,
  },
];


// Catálogo de Tipos de Afectación del IGV → Tributos
export const MAP_TIPO_AFECTACION_TRIBUTO: Record<
  number,
  { id: string; name: string; taxTypeCode: string }
> = {
  // Gravadas
  10: { id: '1000', name: 'IGV', taxTypeCode: 'VAT' }, // Operación Onerosa
  11: { id: '9996', name: 'IGV', taxTypeCode: 'VAT' }, // Retiro por premio
  12: { id: '9996', name: 'IGV', taxTypeCode: 'VAT' }, // Retiro por donación
  13: { id: '9996', name: 'IGV', taxTypeCode: 'VAT' }, // Retiro
  14: { id: '9996', name: 'IGV', taxTypeCode: 'VAT' }, // Retiro por publicidad
  15: { id: '9996', name: 'IGV', taxTypeCode: 'VAT' }, // Bonificaciones
  16: { id: '9996', name: 'IGV', taxTypeCode: 'VAT' }, // Retiro a trabajadores
  17: { id: '1016', name: 'IVAP', taxTypeCode: 'VAT' }, // IVAP

  // Exoneradas
  20: { id: '9997', name: 'EXO', taxTypeCode: 'VAT' }, // Operación Onerosa
  21: { id: '1000', name: 'IGV', taxTypeCode: 'VAT' }, // Transferencia gratuita

  // Inafectas
  30: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Operación Onerosa
  31: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Retiro por bonificación
  32: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Retiro
  33: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Muestras Médicas
  34: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Convenio Colectivo
  35: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Retiro por premio
  36: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }, // Retiro por publicidad
  37: { id: '1000', name: 'IGV', taxTypeCode: 'FRE' }, // Transferencia gratuita

  // Exportación
  40: { id: '9995', name: 'EXP', taxTypeCode: 'FRE' }, // Exportación de Bienes o Servicios
};
export const MTO_CERO = "0.00"; 
export const MTO_CERO_NUMBER = 0.0; 
export const UNIDAD_MEDIDAD_DEFAULT = 'NIU'
export const COD_PRUCTO_ANULACION = 'ANUL'
export const CANTIDAD_DEFAULT = '1.0000'
export const TAX_EXEPTION_REASONCODE_ICBPER  = '9996'


