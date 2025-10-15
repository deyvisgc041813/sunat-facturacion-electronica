import { CpeDto } from "../dto/cpe/consultar-lote.cpe.dto";


interface IResultadoCpe {
  cpe: CpeDto;
  estado: string;
  descripcion: string;
  raw?: string;
  error?: string;
}