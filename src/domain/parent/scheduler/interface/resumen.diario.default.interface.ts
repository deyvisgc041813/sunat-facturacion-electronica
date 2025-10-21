export interface IResumenDefaultSunat {
  ublVersion: string;
  customizationID: string;
  sucursalId: number;
  fecGeneracion: string;
  fecReferencia: string;
  serieResumen: string;
  company: ICompanyDefault;
}
export interface ICompanyDefault {
  ruc: string;
  tipoDoc: string;
  razonSocial: string;
}
