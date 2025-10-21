/**
 * Ejecuta una función async con reintentos automáticos.
 * @param fn - función asíncrona que será ejecutada
 * @param maxRetries - número máximo de reintentos
 * @param delayMs - tiempo de espera entre reintentos (en milisegundos)
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(
        `Intento ${attempt} de ${maxRetries} fallido: ${error.message || error}`,
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('Todos los intentos fallaron después de', maxRetries, 'reintentos');
  throw lastError;
}
