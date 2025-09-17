import { BadRequestException } from '@nestjs/common';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { CodigoProductoNotaDebito } from './catalogo.enum';

export type TipoNotaDebito = 'GLOBAL' | 'ITEM' | 'INVALIDO';


export class NotaDebitoHelper {
  static determinarTipoAumento(
    facturaOriginal: DetailDto[],
    notaDebito: DetailDto[],
  ): TipoNotaDebito {
    if (!notaDebito || notaDebito.length === 0) {
      throw new BadRequestException('La nota de débito no tiene detalles');
    }

    // Caso 1: Aumento global → exactamente 1 item con AU001
    if (
      notaDebito.length === 1 &&
      notaDebito[0].codProducto ===
        CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION
    ) {
      return 'GLOBAL';
    }

    // Caso 2: Aumento por ítem → todos deben existir en la factura original
    const codigosFactura = facturaOriginal.map((d) => d.codProducto);
    const todosExisten = notaDebito.every((d) =>
      codigosFactura.includes(d.codProducto),
    );

    if (todosExisten) {
      return 'ITEM';
    }

    // Caso 3: Inválido → mezcla de AU001 + productos o productos inexistentes
    return 'INVALIDO';
  }
}
