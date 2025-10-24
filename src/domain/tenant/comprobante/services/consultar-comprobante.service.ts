

import { Injectable } from "@nestjs/common";
import { EmpresaCredencialesSunatRepositoryImpl } from "src/infrastructure/persistence/parent/implement/empresa.credenciales.repository.impl";
import { ConsultarLoteCpeDto } from "../dto/cpe/consultar-lote.cpe.dto";
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { SucursalService } from "src/domain/parent/sucursal/service/sucursal.service";
import { EmpresaService } from "src/domain/parent/empresa/services/empresa.service";

@Injectable()
export class SunatApiValidationService {
//   constructor(
//     private readonly http: HttpService,
//     private readonly authService: SunatAuthService,
//     private readonly sucursalService:SucursalService,
//     private readonly empesaService:EmpresaService,
//     private readonly credRepo: EmpresaCredencialesSunatRepositoryImpl,
//   ) {}

//   async validarCpe(data: ConsultarLoteCpeDto, auth: IUserPayload) {
//     const cred = await this.empesaService.getById(auth.empresaId ?? 0);
//     if (!cred) throw new Error('La empresa actual autoenticada no existe en la bd');

//     const token = await this.authService.getAccessToken(cred.empresaId);
//     const url = `https://api.sunat.gob.pe/v1/contribuyente/contribuyentews/cpe/${rucEmisor}/${tipoComprobante}/${serie}/${numero}/${monto}`;

//     const res = await this.http.axiosRef.get(url, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     return res.data;
//   }
}
