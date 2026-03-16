import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import type { SessionPayload } from "./auth.types";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & {
      user?: SessionPayload;
    }>();
    const token = request.cookies?.session;

    if (!token) {
      throw new UnauthorizedException("Missing session");
    }

    request.user = this.authService.verifySessionToken(token);
    return true;
  }
}
