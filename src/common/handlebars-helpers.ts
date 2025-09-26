import Handlebars from 'handlebars';

// Función que registra todos los helpers personalizados de Handlebars
export function registerHandlebarsHelpers() {
  
  /**
   * Helper "gt" (greater than = mayor que)
   * Evalúa si a > b
   * - Si es verdadero, renderiza el bloque {{#gt ...}}...{{/gt}}
   * - Si es falso, renderiza el bloque dentro de {{else}}
   */
  Handlebars.registerHelper('gt', function (a: number, b: number, options) {
    return a > b ? options.fn(this) : options.inverse(this);
  });

  /**
   * Helper "eq" (equal = igual a)
   * Evalúa si a == b
   * - Si es verdadero, renderiza el bloque {{#eq ...}}...{{/eq}}
   * - Si es falso, renderiza el bloque dentro de {{else}}
   */
  Handlebars.registerHelper('eq', function (a: any, b: any, options) {
    return a == b ? options.fn(this) : options.inverse(this);
  });

  /**
   * Helper "lt" (less than = menor que)
   * Evalúa si a < b
   * - Si es verdadero, renderiza el bloque {{#lt ...}}...{{/lt}}
   * - Si es falso, renderiza el bloque dentro de {{else}}
   */
  Handlebars.registerHelper('lt', function (a: number, b: number, options) {
    return a < b ? options.fn(this) : options.inverse(this);
  });

}
