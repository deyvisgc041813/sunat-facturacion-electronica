// catalogo-tipo.dto.ts
export class ResponseCatalogoTipoDTO {

   constructor(
    public readonly catalogoTipoId: number, // PK
    public readonly codigoCatalogo: string, // Código del catálogo (ej: 01, 02, 03)
    public readonly descripcion: string, // Descripción del catálogo
    public readonly catalogoDetalle: ResponseCatalogoDetalleDTO[]
  ) {}
}

// catalogo-detalle.dto.ts
export class ResponseCatalogoDetalleDTO {
  constructor(
    public readonly catalogoDetalleId: number, // PK
    public readonly codigo: string, // Código del detalle (ej: 01, A, 05, etc.)
    public readonly descripcion: string, // Descripción del detalle
    public readonly nombre?: string | null, // Puede ser NULL
    public readonly codigoInternacional?: string | null, // Puede ser NULL
    public readonly tipoComprobanteAsociado?: string | null, // Puede ser NULL)
    public readonly tipoAfectacion?: string | null
  ) {}
}
