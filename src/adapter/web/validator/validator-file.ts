import { BusinessLogicException } from '../exception/exeception-dynamic';

export class FileValidatorUtil {
  static validarCertificado(certificado?: Express.Multer.File) {
    if (!certificado) {
      throw new BusinessLogicException('El certificado digital de la empresa es obligatorio');
    }
    // validar extensión por nombre del archivo
    if (!/\.(pfx|pem)$/i.test(certificado.originalname)) {
      throw new BusinessLogicException('El certificado debe ser un archivo .pfx o .pem');
    }

    // validar tamaño (1MB)
    if (certificado.size > 1024 * 1024) {
      throw new BusinessLogicException('El certificado no debe superar 1MB');
    }

    return true;
  }

  static validarLogo(logo?: Express.Multer.File) {
    if (!logo) {
      throw new BusinessLogicException('El logo de la empresa es obligatorio');
    }

    // validar extensión
    if (!/\.(jpg|jpeg|png|webp|svg)$/i.test(logo.originalname)) {
      throw new BusinessLogicException('El logo debe ser JPG, PNG, WebP o SVG');
    }

    // validar tamaño (2MB)
    if (logo.size > 1024 * 1024 * 2) {
      throw new BusinessLogicException('El logo no debe superar 2MB');
    }

    return true;
  }
}
