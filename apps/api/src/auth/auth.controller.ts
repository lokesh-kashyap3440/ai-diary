import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser } from "./current-user.decorator";
import { LoginPasswordDto } from "./dto/login-password.dto";
import { RequestMagicLinkDto } from "./dto/request-magic-link.dto";
import { RegisterPasswordDto } from "./dto/register-password.dto";
import { SessionGuard } from "./session.guard";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/request-link")
  requestMagicLink(@Body() body: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(body);
  }

  @Post("auth/register")
  async register(
    @Body() body: RegisterPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerWithPassword(body);
    response.cookie("session", result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true, user: result.user };
  }

  @Post("auth/login")
  async login(
    @Body() body: LoginPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithPassword(body);
    response.cookie("session", result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true, user: result.user };
  }

  @Get("auth/verify")
  async verifyMagicLink(
    @Query("token") token: string,
    @Query("redirectTo") redirectTo: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionToken = await this.authService.verifyMagicLink(token);
    const safeRedirectUrl = this.authService.getSafeRedirectUrl(redirectTo);
    response.cookie("session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.redirect(302, safeRedirectUrl);
  }

  @Post("auth/logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("session", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { success: true };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.getSessionUser(user.sub);
  }
}
