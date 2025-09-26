export interface ItemComprobante {
  cantidad: string;
  unidad: string;
  descripcion: string;
  pUnit: string;
  descuento: string;
  total: string;
  //modelo: string;
  //lote: string;
  //serie: string;
}

export interface IComprobantePdfDto {
  logo: string;
  empresa: string;
  rucEmpresa: string;
  direccionEmpresa: string;
  telefonoEmpresa: string;
  emailEmpresa: string;
  cliente: string;
  tipoDocLabel: string;
  numeroDocumento:string,
  direccionCliente: string;
  telefonoCliente: string;
  serie: string;
  fechaEmision: string;
  fechaVencimiento: string;
  opGravadas: string;
  opExoneradas: string;
  opInafectas: string;
  igv: string;
  total: string;
  montoLetras: string;
  qrPath: string;
  hash: string;
  condicionPago: string;
  medioPago: string;
  vendedor: string;
  urlConsulta: string;
  titleComprobante:string;
  items: ItemComprobante[];
}
