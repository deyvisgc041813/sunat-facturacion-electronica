import { BadRequestException } from "@nestjs/common";
import { CatalogoEnum } from "./CatalogoEnum";
import { CreateClienteDto } from "../domain/cliente/dto/CreateRequestDto";
import { UpdateClienteDto } from "../domain/cliente/dto/UpdateClienteDto";

export function validarSoloNumeros(valor: string, longitud: number, mensaje: string) {
  const regex = new RegExp(`^\\d{${longitud}}$`);
  if (!regex.test(valor)) {
    throw new BadRequestException(mensaje);
  }
}

export function validarLongitudMinima(valor: string, longitud: number, mensaje: string) {
  if (!valor || valor.length < longitud) {
    throw new BadRequestException(mensaje);
  }
}
export function validarDatosSegunTipoDocumento(cliente: CreateClienteDto | UpdateClienteDto) {
  const numeroDocumento = cliente.numeroDocumento ?? ""
  switch (cliente.tipoDocumento) {

    case CatalogoEnum.DNI:
      validarSoloNumeros(numeroDocumento, 8, 'El DNI debe tener 8 dígitos numéricos');
      if (!cliente.nombre) {
        throw new BadRequestException('El nombre del cliente es obligatorio');
      }
      if (!cliente.apellidoPaterno || !cliente.apellidoMaterno) {
        throw new BadRequestException('Los apellidos son obligatorios');
      }
      break;

    case CatalogoEnum.RUC:
      validarSoloNumeros(numeroDocumento, 11, 'El RUC debe tener 11 dígitos numéricos');
      if (!cliente.razonSocial) {
        throw new BadRequestException('La razón social del cliente es obligatoria');
      }
      break;

    case CatalogoEnum.CARNET_EXTRANJERIA:
      validarLongitudMinima(numeroDocumento, 6, 'El Carnet de extranjería es demasiado corto');
      break;

    case CatalogoEnum.PASAPORTE:
      validarLongitudMinima(numeroDocumento, 6, 'El pasaporte es demasiado corto');
      break;

    case CatalogoEnum.CEDULA_DIPLOMATICA:
      validarLongitudMinima(numeroDocumento, 6, 'La cédula diplomática es demasiado corta');
      break;

    case CatalogoEnum.DOC_TRIB_NO_DOM_SIN_RUC:
      // no se valida longitud
      break;

    default:
      throw new BadRequestException('Tipo de documento no soportado');
  }
  }
