// domain/sunat/ports/sunat-validation.port.ts
export interface ISunatValidationPort {
  validarCpe(
    rucEmisor: string,
    tipoComprobante: string,
    serie: string,
    numero: string,
    monto: number,
  ): Promise<any>;
}
