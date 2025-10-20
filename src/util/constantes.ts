import { ETablaAudit } from './general.enum';

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
export const MTO_CERO = '0.00';
export const MTO_CERO_NUMBER = 0.0;
export const UNIDAD_MEDIDAD_DEFAULT = 'NIU';
export const COD_PRUCTO_ANULACION = 'ANUL';
export const CANTIDAD_DEFAULT = '1.0000';
export const TAX_EXEPTION_REASONCODE_ICBPER = '9996';

export const APLICACION_ORIGEN = 'facturacion-electronica';
export const SQL_SPGUARDAR_COMPROBANTE = `
          CREATE PROCEDURE \`sp_guardar_comprobante\`(
            IN p_sucursal_id INT,
            IN p_cliente_id INT,
            IN p_tipo_comprobante VARCHAR(2),
            IN p_serie VARCHAR(4),
            IN p_fec_emision DATETIME,
            IN p_fec_vencimiento DATETIME,
            IN p_moneda VARCHAR(3),
            IN p_mto_oper_gravadas DECIMAL(12,2),
            IN p_mto_oper_exoneradas DECIMAL(12,2),
            IN p_mto_oper_inafectas DECIMAL(12,2),
            IN p_mto_igv DECIMAL(12,2),
            IN p_mto_imp_venta DECIMAL(12,2),
            IN p_mto_icbper DECIMAL(12,2),
            IN p_cliente_tipo_doc VARCHAR(2),
            IN p_cliente_num_doc VARCHAR(20),
            IN p_payload_json JSON
          )
          BEGIN
            DECLARE v_numero INT;
            DECLARE v_comprobante_id INT;
            DECLARE v_serie_id INT;
            DECLARE v_nueva_serie VARCHAR(4);

            -- Manejador general de errores SQL
            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                SIGNAL SQLSTATE '45000'
                 SET MESSAGE_TEXT = 'Error al guardar el comprobante. La transacción fue revertida.';
            END;

            -- Iniciar transacción
            START TRANSACTION;

            -- Buscar serie y correlativo actual
            SELECT serie_comprobante_id, correlativo_actual + 1
            INTO v_serie_id, v_numero
            FROM ${ETablaAudit.SERIE_COMPROBANTE}
            WHERE sucursal_id = p_sucursal_id
              AND tipo_comprobante = p_tipo_comprobante
              AND serie = p_serie
            FOR UPDATE;

            -- Validar existencia de serie
            IF v_serie_id IS NULL THEN
              SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'La serie indicada no existe o no está registrada en la configuración de comprobantes.';
            END IF;
            -- Si el correlativo supera el límite, generar nueva serie
            IF v_numero > 9999999 THEN
              SET v_nueva_serie = CONCAT(LEFT(p_serie,1), LPAD(CAST(SUBSTRING(p_serie,2,3) AS UNSIGNED) + 1, 3, '0'));

              SELECT serie_comprobante_id, correlativo_actual + 1
              INTO v_serie_id, v_numero
              FROM ${ETablaAudit.SERIE_COMPROBANTE}
              WHERE sucursal_id = p_sucursal_id
                AND tipo_comprobante = p_tipo_comprobante
                AND serie = v_nueva_serie
              FOR UPDATE;

              -- Si la nueva serie no existe, crearla automáticamente
              IF v_serie_id IS NULL THEN
                INSERT INTO ${ETablaAudit.SERIE_COMPROBANTE} (sucursal_id, tipo_comprobante, serie, correlativo_inicial, correlativo_actual, fecha_registro, fecha_modificacion)
                VALUES (p_sucursal_id, p_tipo_comprobante, v_nueva_serie, 1, 0, NOW(), NOW());
                
                SET v_serie_id = LAST_INSERT_ID();
                SET v_numero = 1;
              END IF;

              SET p_serie = v_nueva_serie;
            END IF;

            
            -- Actualizar JSON con correlativo
            SET p_payload_json = JSON_SET(p_payload_json, '$.correlativo', v_numero);

            -- Insertar comprobante
            INSERT INTO  ${ETablaAudit.COMPROBANTE} (
              sucursal_id, cliente_id, serie_comprobante_id, numero_comprobante, fecha_emision, fecha_vencimiento, moneda,
              mto_oper_gravadas, mto_oper_exoneradas, mto_oper_inafectas, mto_igv, mto_imp_venta, icbper, estado,
              payload_json, serie_correlativo, fecha_registro, fecha_modificacion, comunicado_sunat
            )
            VALUES (
              p_sucursal_id, p_cliente_id, v_serie_id, v_numero, p_fec_emision, p_fec_vencimiento, p_moneda,
              p_mto_oper_gravadas, p_mto_oper_exoneradas, p_mto_oper_inafectas, p_mto_igv, p_mto_imp_venta, p_mto_icbper, 'PENDIENTE',
              p_payload_json,
              CONCAT(p_serie, '-', LPAD(v_numero, 7, '0')),
              NOW(), NOW(), '0'
            );

            SET v_comprobante_id = LAST_INSERT_ID();

            -- Actualizar correlativo en la serie
            UPDATE ${ETablaAudit.SERIE_COMPROBANTE}
            SET correlativo_actual = v_numero, fecha_modificacion = NOW()
            WHERE serie_comprobante_id = v_serie_id;
            
            COMMIT;
            -- Confirmar cambios
            SELECT v_comprobante_id AS comprobante_id,
              v_numero AS numero_correlativo,
              p_serie AS serie,
              p_tipo_comprobante AS tipo_comprobante,
              'Comprobante guardado correctamente.' AS mensaje;
          END;
        `;
export const SQL_EXISTE_SPGC = `
          SELECT COUNT(*) AS total
          FROM information_schema.ROUTINES
          WHERE ROUTINE_SCHEMA = DATABASE()
            AND ROUTINE_NAME = 'sp_guardar_comprobante';
        `;
