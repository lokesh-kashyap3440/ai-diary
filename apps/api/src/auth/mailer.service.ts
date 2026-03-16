import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMagicLink(email: string, url: string) {
    const host = this.configService.get<string>("SMTP_HOST");
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const from = this.configService.get<string>("MAIL_FROM", "noreply@ai-diary.local");

    if (!host || !user || !pass) {
      this.logger.log(`Magic link for ${email}: ${url}`);
      return { delivered: false, previewUrl: url };
    }

    const transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>("SMTP_PORT", 587),
      secure: this.configService.get<string>("SMTP_SECURE", "false") === "true",
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: "Your AI Diary magic link",
        text: `Sign in to AI Diary: ${url}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown SMTP delivery error";
      this.logger.warn(`SMTP delivery failed for ${email}: ${message}`);
      this.logger.log(`Magic link fallback for ${email}: ${url}`);
      return { delivered: false, previewUrl: url };
    }

    return { delivered: true, previewUrl: undefined };
  }
}
