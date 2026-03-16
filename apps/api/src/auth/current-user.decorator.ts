import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { SessionPayload } from "./auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as SessionPayload;
  },
);
