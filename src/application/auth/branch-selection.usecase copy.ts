import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { AuthService } from "src/domain/auth/services/auth.service";


export class BranchSelectionUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(sucursalId: number, auth: IUserPayload) {
    return this.authService.branchActive(sucursalId, auth)
  }
}