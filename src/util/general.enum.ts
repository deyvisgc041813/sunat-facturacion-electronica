export enum UserRole {
  ADMIN = 'admin',     // Administrador
  MANAGER = 'manager', // Gerente
  USER = 'user',       // Usuario normal
}

export enum ETablaAudit {
  SUCURSAL = 'sucursales',
  EMPRESA = 'empresas',
  USUARIO = 'usuarios',
  COMPROBANTE = 'comprobantes',
  CLIENTE = 'clientes',
  PRODUCTO = 'productos',
  SERIE_COMPROBANTE = 'series_comprobantes'
}
export enum EAccionAudit {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ANULACION = 'ANULACION',
  CONSULTA = 'CONSULTA'
}
export enum Plan {
  Basico = '01',        // Código para Plan Básico
  Estándar = '02',      // Código para Plan Estándar
  Profesional = '03',   // Código para Plan Profesional
  Empresarial = '04',   // Código para Plan Empresarial
}
