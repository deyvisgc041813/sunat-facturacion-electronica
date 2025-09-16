-- ==========================================================
-- BASE DE DATOS: facturacion_electronica_pe
-- ==========================================================


CREATE TABLE empresas (
  empresa_id INT AUTO_INCREMENT PRIMARY KEY,
  ruc VARCHAR(11) NOT NULL UNIQUE,
  razon_social VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  direccion VARCHAR(255),
  certificado_digital LONGBLOB,
  clave_certificado VARCHAR(100),
  usuario_sol VARCHAR(50) NOT NULL,
  clave_sol VARCHAR(50) NOT NULL,
  modo VARCHAR(10) DEFAULT 'BETA',
  estado TINYINT DEFAULT 1
);
-- Tabla de clientes
CREATE TABLE clientes (
  cliente_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  tipo_documento VARCHAR(2) NOT NULL,
  numero_documento VARCHAR(15) NOT NULL,
  
  razon_social VARCHAR(255), -- empresas (RUC)
  
  nombres VARCHAR(100),      -- personas
  apellido_paterno VARCHAR(100),
  apellido_materno VARCHAR(100),
  estado_contribuyente VARCHAR(50),   -- ACTIVO, BAJA DEFINITIVA, etc.
  condicion_domicilio VARCHAR(50),    -- HABIDO, NO HABIDO
  fecha_consulta_sunat DATETIME,       -- Cuándo se consultó

  direccion VARCHAR(255),
  correo VARCHAR(150),
  telefono VARCHAR(50),
  estado TINYINT DEFAULT 1,
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id)
);

CREATE TABLE usuarios (
  usuario_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(150),
  rol VARCHAR(50) DEFAULT 'USUARIO',
  estado TINYINT DEFAULT 1
);
-- Relación usuarios con empresas (multiempresa)
CREATE TABLE usuarios_empresas (
  usuario_empresa_id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  empresa_id INT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id),
  UNIQUE(usuario_id, empresa_id)
);
-- Tabla de productos
CREATE TABLE productos (
  producto_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  unidad_medida VARCHAR(5) DEFAULT 'NIU',
  precio_unitario DECIMAL(12,2) NOT NULL,
  afecta_igv TINYINT DEFAULT 1,
  estado TINYINT DEFAULT 1,
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id)
);

-- Tabla de series y correlativos
CREATE TABLE series (
  serie_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  tipo_comprobante VARCHAR(2) NOT NULL, -- 01=Factura, 03=Boleta, 07=NC, 08=ND
  serie VARCHAR(4) NOT NULL,            -- Ej: F001, B001
  correlativo_inicial INT DEFAULT 1,    -- desde dónde empieza
  correlativo_actual INT DEFAULT 0,     -- último correlativo usado
  estado TINYINT DEFAULT 1,             -- 1=activo, 0=inactivo
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id),
  UNIQUE (empresa_id, tipo_comprobante, serie)
);


-- Tabla de comprobantes
CREATE TABLE comprobantes (
  comprobante_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NOT NULL,
  serie_id INT NOT NULL,
  numero_comprobante INT NOT NULL,
  fecha_emision DATETIME NOT NULL,
  moneda VARCHAR(3) DEFAULT 'PEN',
  total_gravado DECIMAL(12,2) DEFAULT 0,
  total_exonerado DECIMAL(12,2) DEFAULT 0,
  total_inafecto DECIMAL(12,2) DEFAULT 0,
  total_igv DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  xml LONGTEXT NOT NULL,   -- XML firmado del comprobante completo
  cdr LONGBLOB,            -- CDR (ZIP binario de SUNAT)
  hash_cpe VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  payload_json json,
  motivo_estado   VARCHAR(200),
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id),
  FOREIGN KEY (serie_id) REFERENCES series(serie_id),
  UNIQUE (empresa_id, tipo_comprobante, serie, numero)
);



CREATE TABLE comprobantes (
  comprobante_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NOT NULL,
  serie_id INT NOT NULL,                  -- relación con tabla series
  numero INT NOT NULL,
  fecha_emision DATETIME NOT NULL,
  moneda VARCHAR(3) DEFAULT 'PEN',
  mto_oper_gravadas DECIMAL(12,2) DEFAULT 0,
  mto_oper_exoneradas DECIMAL(12,2) DEFAULT 0,
  mto_oper_inafectas DECIMAL(12,2) DEFAULT 0,
  mto_igv DECIMAL(12,2) DEFAULT 0,
  mto_imp_venta DECIMAL(12,2) NOT NULL,   -- total del comprobante
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  xml LONGTEXT,                           -- XML firmado (nullable al inicio)
  cdr LONGBLOB,                           -- CDR de SUNAT
  hash_cpe VARCHAR(100),
  payload_json JSON,                      -- opcional: payload original
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id),
  FOREIGN KEY (serie_id) REFERENCES series(serie_id),
  UNIQUE (empresa_id, serie_id, numero)   -- garantiza unicidad
);



-- Tabla detalle de comprobantes
CREATE TABLE comprobante_detalle (
  com_det_id INT AUTO_INCREMENT PRIMARY KEY,
  comprobante_id INT NOT NULL,
  producto_id INT,
  descripcion VARCHAR(255) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL,
  valor_unitario DECIMAL(12,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  igv DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(comprobante_id),
  FOREIGN KEY (producto_id) REFERENCES productos(producto_id)
);









-- Tabla de notas de crédito/débito
CREATE TABLE notas (
  notas_id INT AUTO_INCREMENT PRIMARY KEY,
  comprobante_id INT NOT NULL,
  comprobante_origen_id INT NOT NULL,
  motivo VARCHAR(255),
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(comprobante_id),
  FOREIGN KEY (comprobante_origen_id) REFERENCES comprobantes(comprobante_id)
);

-- Tabla de logs de envío a SUNAT
CREATE TABLE sunat_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comprobante_id INT NOT NULL,
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  request LONGTEXT,
  response LONGTEXT,
  estado VARCHAR(20),
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(comprobante_id)
);

-- Tabla de validación de comprobantes
CREATE TABLE validacion_comprobantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comprobante_id INT NOT NULL,
  fecha_validacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado_sunat VARCHAR(20),
  descripcion VARCHAR(255),
  response LONGTEXT,
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(comprobante_id)
);

-- Tabla de resúmenes de boletas
CREATE TABLE resumen_boletas (
  res_bol_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  fecha_generacion DATE NOT NULL,
  fecha_emision DATE NOT NULL,
  correlativo INT NOT NULL,
  nombre_archivo VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  xml LONGTEXT,
  cdr LONGTEXT,
  hash_resumen VARCHAR(100),
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id),
  UNIQUE (empresa_id, fecha_emision, correlativo)
);

-- Detalle de resúmenes de boletas
CREATE TABLE resumen_boletas_detalle (
  res_bol_det_id INT AUTO_INCREMENT PRIMARY KEY,
  resumen_id INT NOT NULL,
  comprobante_id INT NOT NULL,
  operacion VARCHAR(10) NOT NULL,
  FOREIGN KEY (resumen_id) REFERENCES resumen_boletas(res_bol_id),
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(comprobante_id)
);

-- Tabla de comunicación de bajas (anulación de comprobantes)
CREATE TABLE baja_comprobantes (
  baja_comprobante_id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  fecha_generacion DATE NOT NULL,
  fecha_comunicacion DATE NOT NULL,
  correlativo INT NOT NULL,
  nombre_archivo VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  xml LONGTEXT,
  cdr LONGTEXT,
  FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id),
  UNIQUE (empresa_id, fecha_generacion, correlativo)
);

-- Detalle de comunicación de bajas
CREATE TABLE baja_comprobantes_detalle (
  baja_comprobante_detalle_id INT AUTO_INCREMENT PRIMARY KEY,
  baja_id INT NOT NULL,
  comprobante_id INT NOT NULL,
  motivo VARCHAR(255),
  FOREIGN KEY (baja_id) REFERENCES baja_comprobantes(baja_comprobante_id),
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(comprobante_id)
);

-- Tabla de catálogos SUNAT (genérica)
CREATE TABLE catalogo_tipo (
  catalogo_tipo_id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_catalogo VARCHAR(5) UNIQUE,
  descripcion VARCHAR(255)
);

CREATE TABLE catalogo_detalle (
  catalogo_detalle_id INT AUTO_INCREMENT PRIMARY KEY,
  catalogo_id INT NOT NULL,
  codigo VARCHAR(10) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  FOREIGN KEY (catalogo_id) REFERENCES catalogo_tipo(catalogo_tipo_id)
);

CREATE TABLE series_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serie_id INT NOT NULL,
  usuario_id INT NOT NULL,
  correlativo_anterior INT NOT NULL,
  correlativo_nuevo INT NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (serie_id) REFERENCES series(serie_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
);

CREATE TABLE error_logs (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,   -- identificador único
  empresa_id      BIGINT NOT NULL,                     -- id interno de la empresa en tu sistema
  tipo_comprobante VARCHAR(2) NOT NULL,                -- 01 factura, 03 boleta, etc.
  serie           VARCHAR(4) NOT NULL,                 -- serie del comprobante (ej: B001)
  correlativo     VARCHAR(20) NOT NULL,                -- correlativo del comprobante (ej: 1)
  origen          VARCHAR(50) NOT NULL,                -- SUNAT | SISTEMA
  codigo_error    VARCHAR(100) NULL,                   -- faultcode o código interno
  mensaje_error   VARCHAR(500) NOT NULL,               -- faultstring o mensaje
  detalle_error   TEXT NULL,                           -- detalle extendido o JSON
  estado          VARCHAR(20) DEFAULT 'PENDIENTE',     -- PENDIENTE, REINTENTADO, SOLUCIONADO
  fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- fecha del error--
);




/*Tabla maestra tipos de catalogos*/
INSERT INTO catalogo_tipo (codigo_catalogo, descripcion) VALUES
('01', 'Tipos de comprobantes'),
('02', 'Monedas'),
('03', 'Unidades de medida'),
('06', 'Tipos de documento de identidad'),
('09', 'Motivos de nota de crédito'),
('10', 'Motivos de nota de débito'),
('17', 'Tipos de operación');


/*Catálogo 01 – Tipos de comprobantes*/
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '01', 'Factura' FROM catalogo_tipo WHERE codigo_catalogo='01';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '03', 'Boleta de Venta' FROM catalogo_tipo WHERE codigo_catalogo='01';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '07', 'Nota de Crédito' FROM catalogo_tipo WHERE codigo_catalogo='01';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '08', 'Nota de Débito' FROM catalogo_tipo WHERE codigo_catalogo='01';



/*Catálogo 02 – Tipos de comprobantes*/
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'PEN', 'Sol' FROM catalogo_tipo WHERE codigo_catalogo='02';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'USD', 'Dólar Americano' FROM catalogo_tipo WHERE codigo_catalogo='02';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'EUR', 'Euro' FROM catalogo_tipo WHERE codigo_catalogo='02';

/*Catálogo 03 – Unidades de medida*/
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'NIU', 'Número de Unidades' FROM catalogo_tipo WHERE codigo_catalogo='03';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'KGM', 'Kilogramo' FROM catalogo_tipo WHERE codigo_catalogo='03';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'LTR', 'Litro' FROM catalogo_tipo WHERE codigo_catalogo='03';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'MTR', 'Metro' FROM catalogo_tipo WHERE codigo_catalogo='03';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'ZZ', 'Unidad genérica internacional' FROM catalogo_tipo WHERE codigo_catalogo='03';

/*Catálogo 06 – Tipos de documento de identidad*/

INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '0', 'DOC.TRIB.NO.DOM.SIN.RUC' FROM catalogo_tipo WHERE codigo_catalogo='06';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '1', 'DNI - Documento Nacional de Identidad' FROM catalogo_tipo WHERE codigo_catalogo='06';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '4', 'Carnet de extranjería' FROM catalogo_tipo WHERE codigo_catalogo='06';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '6', 'RUC - Registro Único de Contribuyentes' FROM catalogo_tipo WHERE codigo_catalogo='06';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '7', 'Pasaporte' FROM catalogo_tipo WHERE codigo_catalogo='06';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, 'A', 'Cédula diplomática de identidad' FROM catalogo_tipo WHERE codigo_catalogo='06';

/*Catálogo 09 – Motivos de Nota de Crédito*/
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '01', 'Anulación de la operación' FROM catalogo_tipo WHERE codigo_catalogo='09';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '02', 'Anulación por error en el RUC' FROM catalogo_tipo WHERE codigo_catalogo='09';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '03', 'Corrección por error en la descripción' FROM catalogo_tipo WHERE codigo_catalogo='09';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '06', 'Devolución total' FROM catalogo_tipo WHERE codigo_catalogo='09';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '07', 'Devolución parcial' FROM catalogo_tipo WHERE codigo_catalogo='09';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '13', 'Otros' FROM catalogo_tipo WHERE codigo_catalogo='09';

/*Catálogo 10 – Motivos de Nota de Débito*/
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '01', 'Intereses por mora' FROM catalogo_tipo WHERE codigo_catalogo='10';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '02', 'Aumento en el valor' FROM catalogo_tipo WHERE codigo_catalogo='10';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '03', 'Penalidades/otros conceptos' FROM catalogo_tipo WHERE codigo_catalogo='10';

/*Catálogo 17 – Tipos de operación*/
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '0101', 'Venta interna' FROM catalogo_tipo WHERE codigo_catalogo='17';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '0200', 'Exportación de bienes' FROM catalogo_tipo WHERE codigo_catalogo='17';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '0201', 'Exportación de servicios' FROM catalogo_tipo WHERE codigo_catalogo='17';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '0301', 'Operaciones con carta porte aéreo' FROM catalogo_tipo WHERE codigo_catalogo='17';
INSERT INTO catalogo_detalle (catalogo_tipo_id, codigo, descripcion)
SELECT catalogo_tipo_id, '1001', 'Venta de bienes afectos a IVAP' FROM catalogo_tipo WHERE codigo_catalogo='17';


/*Procedure guardar comprobante y aumentar correlativo*/

DROP PROCEDURE IF EXISTS sp_guardar_comprobante;


DROP PROCEDURE IF EXISTS sp_guardar_comprobante;


DELIMITER $$
CREATE PROCEDURE sp_guardar_comprobante(
  IN p_empresa_id INT,
  IN p_tipo_comprobante VARCHAR(2),
  IN p_serie VARCHAR(4),
  IN p_fec_emision DATETIME,
  IN p_moneda VARCHAR(3),
  IN p_mto_oper_gravadas DECIMAL(12,2),
  IN p_mto_oper_exoneradas DECIMAL(12,2),
  IN p_mto_oper_inafectas DECIMAL(12,2),
  IN p_mto_igv DECIMAL(12,2),
  IN p_mto_imp_venta DECIMAL(12,2),
  IN p_cliente_tipo_doc VARCHAR(2),
  IN p_cliente_num_doc VARCHAR(20),
  IN p_payload_json JSON
)
BEGIN
  DECLARE v_numero INT;
  DECLARE v_comprobante_id INT;
  DECLARE v_serie_id INT;
  DECLARE v_cliente_id INT;

  -- 0. Buscar cliente_id en tabla clientes
  SELECT cliente_id
  INTO v_cliente_id
  FROM clientes
  WHERE numero_documento = p_cliente_num_doc
    AND tipo_documento = p_cliente_tipo_doc
  LIMIT 1;

  -- Si no existe, lanzar error
  IF v_cliente_id IS NULL THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Cliente no registrado en la tabla clientes';
  END IF;

  -- 1. Obtener correlativo actual + 1 con bloqueo
  SELECT serie_id, correlativo_actual + 1
  INTO v_serie_id, v_numero
  FROM series
  WHERE empresa_id = p_empresa_id
    AND tipo_comprobante = p_tipo_comprobante
    AND serie = p_serie
    
  FOR UPDATE;
	-- 1.1 Validar que exista
	IF v_serie_id IS NULL THEN
	  SIGNAL SQLSTATE '45000'
		SET MESSAGE_TEXT = 'Serie no encontrada en la tabla series';
	END IF;
  -- 2. Insertar comprobante (estado siempre PENDIENTE)
  INSERT INTO comprobantes (
    empresa_id, cliente_id, serie_id, numero_comprobante, fecha_emision, moneda,
    mto_oper_gravadas, mto_oper_exoneradas, mto_oper_inafectas, mto_igv, mto_imp_venta, estado,
    payload_json, fecha_creacion, fecha_actualizacion
  )
  VALUES (
    p_empresa_id, v_cliente_id, v_serie_id, v_numero, p_fec_emision, p_moneda,
    p_mto_oper_gravadas, p_mto_oper_exoneradas, p_mto_oper_inafectas, p_mto_igv, p_mto_imp_venta, 'PENDIENTE',
    p_payload_json, now(), now()
  );

  -- 3. Guardar el ID generado
  SET v_comprobante_id = LAST_INSERT_ID();

  -- 4. Actualizar correlativo de la serie
  UPDATE series
  SET correlativo_actual = v_numero
  WHERE serie_id = v_serie_id;

  -- 5. Devolver comprobante_id, numero, serie y tipo
  SELECT v_comprobante_id AS comprobante_id,
         v_numero AS numero_correlativo,
         p_serie AS serie,
         p_tipo_comprobante AS tipo_comprobante,
         v_cliente_id AS cliente_id;
END$$

DELIMITER ;

ALTER TABLE comprobantes 
DROP INDEX empresa_id,
ADD UNIQUE KEY uniq_comprobante (empresa_id, serie_id, numero_comprobante);
CREATE TABLE tributo_tasa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_sunat VARCHAR(10) NOT NULL,   -- Ej: 1000 = IGV, 2000 = ISC, 6030 = ICBPER
    nombre VARCHAR(100) NOT NULL,        -- Ej: IGV, ISC, ICBPER
    tasa DECIMAL(10,4) NULL,             -- Para tributos con porcentaje (ej. 18.00%)
    monto DECIMAL(10,4) NULL,            -- Para montos fijos (ej. 0.70 x bolsa ICBPER)
    moneda CHAR(3) DEFAULT 'PEN',        -- PEN, USD, etc.
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE NULL,            -- NULL = sigue vigente
    observacion VARCHAR(255) NULL
);

INSERT INTO tributo_tasa 
(codigo_sunat, nombre, tasa, monto, moneda, vigencia_desde, vigencia_hasta, observacion)
VALUES
('1000', 'IGV Impuesto General a las Ventas', 18.0000, NULL, 'PEN', '2011-01-01', NULL, 'IGV vigente en Perú (16% IGV + 2% IPM)'),
('1016', 'Impuesto a la Venta Arroz Pilado', NULL, NULL, 'PEN', '2011-01-01', NULL, ''),
('2000', 'ISC Impuesto Selectivo al Consumo', NULL, NULL, 'PEN', '2011-01-01', NULL, 'ISC bebidas alcohólicas'),
('7152', 'Impuesto a la bolsa plastica', 0.7000, NULL, 'PEN', '2025-01-01', '2025-12-31', 'Impuesto al consumo de bolsas plásticas 2025'),
('9995', 'Exportación', NULL, NULL, 'PEN', '2011-01-01', NULL, ''),
('9996', 'Gratuito', NULL, NULL, 'PEN', '2011-01-01', NULL, ''),
('9997', 'Exonerado', NULL, NULL, 'PEN', '2011-01-01', NULL, ''),
('9998', 'Inafecto', NULL, NULL, 'PEN', '2011-01-01', NULL, ''),
('9999', 'Otros tributos', NULL, NULL, 'PEN', '2011-01-01', NULL, '');
