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
}
export enum EAccionAudit {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ANULACION = 'ANULACION',
  CONSULTA = 'CONSULTA'
}