

export function convertirMontoEnLetras(
  monto: number,
  moneda: 'SOLES' | 'DÓLARES' = 'SOLES',
): string {
  // Redondeamos a 2 decimales para evitar errores de coma flotante
  const redondeado = +(monto.toFixed(2));

  // Parte entera
  const entero = Math.floor(redondeado);

  // Decimales exactos (0–99)
  const decimales = Math.round((redondeado - entero) * 100);

  const letrasEntero = numeroALetras(entero);
  return `${letrasEntero} CON ${decimales.toString().padStart(2, '0')}/100 ${moneda}`;
}
function numeroALetras(num: number): string {
  if (num === 0) return 'CERO';

  const UNIDADES = [
    '',
    'UNO',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];

  const DECENAS = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];

  const CENTENAS = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertirMenor100(n: number): string {
    if (n < 20) return UNIDADES[n];
    if (n < 30)
      return n === 20 ? 'VEINTE' : 'VEINTI' + UNIDADES[n - 20].toLowerCase();
    const dec = Math.floor(n / 10);
    const uni = n % 10;
    return DECENAS[dec] + (uni > 0 ? ' Y ' + UNIDADES[uni] : '');
  }

  function convertirMenor1000(n: number): string {
    if (n === 100) return 'CIEN';
    const cen = Math.floor(n / 100);
    const resto = n % 100;
    return (
      (cen > 0 ? CENTENAS[cen] + (resto > 0 ? ' ' : '') : '') +
      (resto > 0 ? convertirMenor100(resto) : '')
    );
  }

  function seccion(
    n: number,
    divisor: number,
    singular: string,
    plural: string,
  ): string {
    const cantidad = Math.floor(n / divisor);
    const resto = n - cantidad * divisor;

    if (cantidad === 0) return '';
    if (cantidad === 1) return singular + (resto > 0 ? ' ' : '');
    return numeroALetras(cantidad) + ' ' + plural + (resto > 0 ? ' ' : '');
  }

  function convertir(n: number): string {
    if (n < 100) return convertirMenor100(n);
    if (n < 1000) return convertirMenor1000(n);
    if (n < 1000000) {
      return (
        seccion(n, 1000, 'MIL', 'MIL') +
        (n % 1000 > 0 ? convertirMenor1000(n % 1000) : '')
      );
    }
    if (n < 1000000000) {
      return (
        seccion(n, 1000000, 'UN MILLÓN', 'MILLONES') +
        (n % 1000000 > 0 ? convertir(n % 1000000) : '')
      );
    }
    if (n < 1000000000000) {
      return (
        seccion(n, 1000000000, 'UN MIL MILLONES', 'MIL MILLONES') +
        (n % 1000000000 > 0 ? convertir(n % 1000000000) : '')
      );
    }
    return 'NÚMERO FUERA DE RANGO';
  }

  return convertir(num).trim();
}