import fs from "fs";
import { parseStringPromise } from "xml2js";

/**
 * Servicio para cargar y consultar los mensajes de error del archivo CodeErrors.xml
 */
export class ErrorCatalogService {
  private static erroresMap: Record<string, string> = {};
  private static isLoaded = false;

  /**
   * Carga el archivo XML de errores a memoria
   */
  static async init(pathXml: string = "src/resources/CodeErrors.xml"): Promise<void> {
    if (this.isLoaded) return; // evita recargar varias veces

    try {
      const xml = fs.readFileSync(pathXml, "utf-8");
      const result = await parseStringPromise(xml);

      this.erroresMap = {};
      result.errors.error.forEach((err: any) => {
        const code = err.$.code;   // atributo code="xxxx"
        const msg = err._.trim();  // texto del nodo <error>
        this.erroresMap[code] = msg;
      });

      this.isLoaded = true;
      console.log(`Catálogo de errores cargado (${Object.keys(this.erroresMap).length} códigos)`);
    } catch (e) {
      console.error("Error cargando CodeErrors.xml:", e);
    }
  }

  /**
   * Obtiene el mensaje amigable del catálogo según el código
   */
  static getMensajeError(code: string): string {
    return this.erroresMap[code] || "Error desconocido";
  }
}
