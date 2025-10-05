export class UbigeoResponseDto {
  constructor(
    public readonly departamento: DepartamentoResponseDto,
  ) {}
}

export class DepartamentoResponseDto {
  constructor(
    public readonly departamentoId: number,
    public readonly descripcion: string,
    public readonly ubigeo: string,
    public readonly provincia?: any,
  ) {}
}

export class ProvinciaResponseDto {
  constructor(
    public readonly provinciaId: number,
    public readonly descripcion: string,
    public readonly ubigeo: string,
    public readonly distrito?: any,
  ) {}
}

export class DistritoResponseDto {
  constructor(
    public readonly distritoId: number,
    public readonly descripcion: string,
    public readonly ubigeo: string,
  ) {}
}
