import { CpeDto } from "../dto/cpe/ConsultarLoteCpeDto";


interface IResultadoCpe {
  cpe: CpeDto;
  estado: string;
  descripcion: string;
  raw?: string;
  error?: string;
}