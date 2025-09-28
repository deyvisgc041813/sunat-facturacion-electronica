SELECT * FROM facturacion_electronica_pe.catalogo_detalle where catalogo_tipo_id = 9;
SELECT * FROM facturacion_electronica_pe.catalogo_tipo;


ALTER TABLE catalogo_detalle 
ADD COLUMN tipo_comprobante_asociado VARCHAR(100) NULL;



CREATE TABLE sucursal (
  sucursal_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  codigo VARCHAR(10) NOT NULL,               -- código de la sucursal
  nombre VARCHAR(100) NOT NULL,              -- ej: Sucursal Lima
  direccion VARCHAR(255) NOT NULL,
  ubigeo VARCHAR(6) NOT NULL,                -- código de SUNAT para ubicación
  telefono VARCHAR(20),
  email VARCHAR(100),

  -- configuración de firma digital
  signature_id VARCHAR(50) NOT NULL DEFAULT 'SIGN-DEFAULT',
  signature_note VARCHAR(100) NULL,

  estado BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);






-- Catálogo 52: Códigos de Leyendas


/*TIPO COMPROBANTES: catalogo_tipo_id => 1 => CODCATALOGO: 01*/
/*TIPO MONEADAS: catalogo_tipo_id => 2 => CODCATALOGO: 02*/
/*UNIDAD DE MEDIDA: catalogo_tipo_id => 3 => CODCATALOGO: 03*/
/*Tipos de documento de identidad: catalogo_tipo_id => 4  => CODCATALOGO: 06**/
/*CODIGO MOTIVOS NOTA DE CREDITO: catalogo_tipo_id => 5*  => CODCATALOGO: '09/
/*CODIGO MOTIVOS NOTA DE DEBITO: catalogo_tipo_id => 6*  => CODCATALOGO:  '10/
/* TIPO OPERACION: catalogo_tipo_id => 7*  => CODCATALOGO:  '17/
/*TIPO TRIBUTOS: catalogo_tipo_id => 8*  => CODCATALOGO:  '05/
/*TIPO DE AFECTACUION: catalogo_tipo_id => 9*  => CODCATALOGO:  '07/
/* Código de tipo de operación guia de remision=> 10*  => CODCATALOGO:  '51/
/* LEYENDAS=> 11*  => CODCATALOGO:  '52/

01	Intereses por mora
02	Aumento en el valor
03	Penalidades/ otros conceptos 
11	Ajustes de operaciones de exportación
12	Ajustes afectos al IVAP

SELECT * FROM facturacion_electronica_pe.catalogo_tipo


01	Anulación de la operación
02	Anulación por error en el RUC
03	Corrección por error en la descripción
04	Descuento global
05	Descuento por ítem
06	Devolución total
07	Devolución por ítem
08	Bonificación
09	Disminución en el valor
10	Otros Conceptos 
11	Ajustes de operaciones de exportación
12	Ajustes afectos al IVAP

INSERT INTO catalogo_detalle 
(catalogo_tipo_id, codigo, nombre, codigo_internacional, descripcion) VALUES
(8, '1000', 'IGV', 'VAT', 'IGV Impuesto General a las Ventas'),
(8, '1016', 'IVAP', 'VAT', 'Impuesto a la Venta Arroz Pilado'),
(8, '2000', 'ISC', 'EXC', 'ISC Impuesto Selectivo al Consumo'),
(8, '7152', 'ICBPER', 'OTH', 'Impuesto a la bolsa plástica'),
(8, '9995', 'EXP', 'FRE', 'Exportación'),
(8, '9996', 'GRA', 'FRE', 'Gratuito'),
(8, '9997', 'EXO', 'VAT', 'Exonerado'),
(8, '9998', 'INA', 'FRE', 'Inafecto'),
(8, '9999', 'OTROS', 'OTH', 'Otros tributos');
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, nombre, descripcion) VALUES
-- Gravadas
(9, '10', 'Gravado - Onerosa', 'Operación gravada con IGV - venta normal'),
(9, '11', 'Gravado - Retiro por premio', 'Operación gravada con IGV por retiro como premio'),
(9, '12', 'Gravado - Retiro por donación', 'Operación gravada con IGV por donación'),
(9, '13', 'Gravado - Retiro', 'Operación gravada con IGV por retiro'),
(9, '14', 'Gravado - Retiro por publicidad', 'Operación gravada con IGV por publicidad'),
(9, '15', 'Gravado - Bonificaciones', 'Operación gravada con IGV por bonificación'),
(9, '16', 'Gravado - Retiro por entrega a trabajadores', 'Operación gravada con IGV por entrega a trabajadores'),
(9, '17', 'Gravado - IVAP', 'Operación gravada con Impuesto a la Venta Arroz Pilado (IVAP)'),

-- Exoneradas
(9, '20', 'Exonerado - Onerosa', 'Operación exonerada con IGV'),
(9, '21', 'Exonerado - Transferencia gratuita', 'Operación exonerada con IGV en transferencia gratuita'),

-- Inafectas
(9, '30', 'Inafecto - Onerosa', 'Operación inafecta con IGV - venta normal'),
(9, '31', 'Inafecto - Retiro por Bonificación', 'Operación inafecta con IGV - bonificación'),
(9, '32', 'Inafecto - Retiro', 'Operación inafecta con IGV - retiro'),
(9, '33', 'Inafecto - Retiro por Muestras Médicas', 'Operación inafecta con IGV - muestras médicas'),
(9, '34', 'Inafecto - Retiro por Convenio Colectivo', 'Operación inafecta con IGV - convenio colectivo'),
(9, '35', 'Inafecto - Retiro por premio', 'Operación inafecta con IGV - premio'),
(9, '36', 'Inafecto - Retiro por publicidad', 'Operación inafecta con IGV - publicidad'),
(9, '37', 'Inafecto - Transferencia gratuita', 'Operación inafecta con IGV - transferencia gratuita'),
(9, '40', 'Exportación de Bienes o Servicios', 'Operación inafecta con IGV por exportación de bienes o servicios');

-- Catálogo 51: Código de Tipo de Operación
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion, tipo_comprobante_asociado) VALUES
(10, '0101', 'Venta interna', 'Factura, Boleta'),
(10, '0112', 'Venta Interna - Sustenta Gastos Deducibles Persona Natural', 'Factura'),
(10, '0113', 'Venta Interna - NRUS', 'Boleta'),
(10, '0200', 'Exportación de Bienes', 'Factura, Boleta'),
(10, '0201', 'Exportación de Servicios – Prestación servicios realizados íntegramente en el país', 'Factura, Boleta'),
(10, '0202', 'Exportación de Servicios – Prestación de servicios de hospedaje No Domiciliado', 'Factura, Boleta'),
(10, '0203', 'Exportación de Servicios – Transporte de navieras', 'Factura, Boleta'),
(10, '0204', 'Exportación de Servicios – Servicios a naves y aeronaves de bandera extranjera', 'Factura, Boleta'),
(10, '0205', 'Exportación de Servicios – Servicios que conformen un Paquete Turístico', 'Factura, Boleta'),
(10, '0206', 'Exportación de Servicios – Servicios complementarios al transporte de carga', 'Factura, Boleta'),
(10, '0207', 'Exportación de Servicios – Suministro de energía eléctrica a favor de sujetos domiciliados en ZED', 'Factura, Boleta'),
(10, '0208', 'Exportación de Servicios – Prestación servicios realizados parcialmente en el extranjero', 'Factura, Boleta'),
(10, '0301', 'Operaciones con Carta de porte aéreo (emitidas en el ámbito nacional)', 'Factura, Boleta'),
(10, '0302', 'Operaciones de Transporte ferroviario de pasajeros', 'Factura, Boleta'),
(10, '0303', 'Operaciones de Pago de regalía petrolera', 'Factura, Boleta'),
(10, '0401', 'Ventas no domiciliados que no califican como exportación', 'Factura, Boleta'),
(10, '1001', 'Operación Sujeta a Detracción', 'Factura, Boleta'),
(10, '1002', 'Operación Sujeta a Detracción - Recursos Hidrobiológicos', 'Factura, Boleta'),
(10, '1003', 'Operación Sujeta a Detracción - Servicios de Transporte Pasajeros', 'Factura, Boleta'),
(10, '1004', 'Operación Sujeta a Detracción - Servicios de Transporte Carga', 'Factura, Boleta'),
(10, '2001', 'Operación Sujeta a Percepción', 'Factura, Boleta');
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion) VALUES
(11, '1000', 'Monto en Letras'),
(11, '1002', 'TRANSFERENCIA GRATUITA DE UN BIEN Y/O SERVICIO PRESTADO GRATUITAMENTE'),
(11, '2000', 'COMPROBANTE DE PERCEPCIÓN'),
(11, '2001', 'BIENES TRANSFERIDOS EN LA AMAZONÍA REGIÓN SELVA PARA SER CONSUMIDOS EN LA MISMA'),
(11, '2002', 'SERVICIOS PRESTADOS EN LA AMAZONÍA REGIÓN SELVA PARA SER CONSUMIDOS EN LA MISMA'),
(11, '2003', 'CONTRATOS DE CONSTRUCCIÓN EJECUTADOS EN LA AMAZONÍA REGIÓN SELVA'),
(11, '2004', 'Agencia de Viaje - Paquete turístico'),
(11, '2005', 'Venta realizada por emisor itinerante'),
(11, '2006', 'Operación sujeta a detracción'),
(11, '2007', 'Operación sujeta al IVAP'),
(11, '2008', 'VENTA EXONERADA DEL IGV-ISC-IPM. PROHIBIDA LA VENTA FUERA DE LA ZONA COMERCIAL DE TACNA'),
(11, '2009', 'PRIMERA VENTA DE MERCANCÍA IDENTIFICABLE ENTRE USUARIOS DE LA ZONA COMERCIAL'),
(11, '2010', 'Restitución Simplificada de Derechos Arancelarios'),
(11, '2011', 'EXPORTACION DE SERVICIOS – DECRETO LEGISLATIVO Nº 919');
