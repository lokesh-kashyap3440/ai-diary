import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AuthRequestDto,
  AuthResponseDto,
  PasswordLoginDto,
  PasswordRegisterDto,
  SessionUserDto,
} from "@ai-diary/types";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import type { SessionPayload } from "./auth.types";
import { MailerService } from "./mailer.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly requestLog = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async requestMagicLink(payload: AuthRequestDto): Promise<AuthResponseDto> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedDisplayName = payload.displayName?.trim() || undefined;
    const lastRequestedAt = this.requestLog.get(normalizedEmail);
    if (lastRequestedAt && Date.now() - lastRequestedAt < 30_000) {
      throw new BadRequestException("Please wait before requesting another magic link.");
    }
    this.requestLog.set(normalizedEmail, Date.now());

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (payload.isRegistration && existingUser) {
      throw new BadRequestException("An account with this email already exists. Sign in instead.");
    }

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update:
        normalizedDisplayName && !existingUser?.displayName
          ? { displayName: normalizedDisplayName }
          : {},
      create: {
        email: normalizedEmail,
        ...(normalizedDisplayName ? { displayName: normalizedDisplayName } : {}),
      },
    });

    const rawToken = randomBytes(24).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() +
        this.configService.get<number>("MAGIC_LINK_TTL_MINUTES", 20) * 60 * 1000,
    );

    await this.prisma.magicLinkToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const webUrl = this.configService.get<string>("WEB_URL", "http://localhost:3000");
    const apiUrl = this.configService.get<string>("API_URL", "http://localhost:4000");
    const redirectTo = `${webUrl}/app`;
    const previewUrl = `${apiUrl}/auth/verify?token=${rawToken}&redirectTo=${encodeURIComponent(
      redirectTo,
    )}`;

    const delivery = await this.mailerService.sendMagicLink(normalizedEmail, previewUrl);

    return {
      success: true,
      message: delivery.delivered
        ? "Magic link sent to your inbox"
        : "Magic link generated",
      previewUrl: delivery.previewUrl,
    };
  }

  async registerWithPassword(payload: PasswordRegisterDto) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser?.passwordHash) {
      throw new BadRequestException("An account with this email already exists.");
    }

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        displayName: payload.displayName.trim(),
        passwordHash: this.hashPassword(payload.password),
      },
      create: {
        email: normalizedEmail,
        displayName: payload.displayName.trim(),
        passwordHash: this.hashPassword(payload.password),
      },
    });

    return {
      sessionToken: this.createSessionToken({
        sub: user.id,
        email: user.email,
      }),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async loginWithPassword(payload: PasswordLoginDto) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user?.passwordHash || !this.verifyPassword(payload.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return {
      sessionToken: this.createSessionToken({
        sub: user.id,
        email: user.email,
      }),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async verifyMagicLink(token: string): Promise<string> {
    if (!token) {
      throw new BadRequestException("Token is required");
    }

    const tokenHash = this.hashToken(token);
    const record = await this.prisma.magicLinkToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException("Magic link is invalid or expired");
    }

    await this.prisma.magicLinkToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    return this.createSessionToken({
      sub: record.user.id,
      email: record.user.email,
    });
  }

  verifySessionToken(token: string): SessionPayload {
    try {
      return jwt.verify(token, this.getJwtSecret()) as SessionPayload;
    } catch {
      throw new UnauthorizedException("Invalid session");
    }
  }

  async getSessionUser(userId: string): Promise<SessionUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  getSafeRedirectUrl(candidate: string | undefined) {
    const webUrl = this.configService.get<string>("WEB_URL", "http://localhost:3000");
    if (!candidate) {
      return `${webUrl}/app`;
    }

    try {
      const redirect = new URL(candidate);
      const allowed = new URL(webUrl);
      if (redirect.origin !== allowed.origin) {
        return `${webUrl}/app`;
      }
      return redirect.toString();
    } catch {
      return `${webUrl}/app`;
    }
  }

  private createSessionToken(payload: SessionPayload) {
    return jwt.sign(payload, this.getJwtSecret(), { expiresIn: "7d" });
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [salt, hash] = passwordHash.split(":");
    if (!salt || !hash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, "hex");
    return derived.length === stored.length && timingSafeEqual(derived, stored);
  }

  private getJwtSecret() {
    return this.configService.get<string>("JWT_SECRET", "change-me");
  }
}
