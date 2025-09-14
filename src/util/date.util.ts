// src/common/utils/date-utils.ts
import dayjs from 'dayjs';
export class DateUtils {

  /**
   * Convierte un string ISO (ej: 2025-09-11T14:26:13-05:00)
   * al formato MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
   */
  static toMySQLDateTime(isoDate: string): string {
    if (!isoDate) {
      throw new Error('Fecha inválida');
    }
    return dayjs(isoDate).format('YYYY-MM-DD HH:mm:ss');
  }

}
