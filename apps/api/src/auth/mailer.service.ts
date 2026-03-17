import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMagicLink(email: string, url: string) {
    const resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    const from = this.configService.get<string>("MAIL_FROM", "noreply@ai-diary.local");

    if (!resendApiKey) {
      this.logger.log(`Magic link for ${email}: ${url}`);
      return { delivered: false, previewUrl: url };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Your AI Diary magic link",
          text: `Sign in to AI Diary: ${url}`,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown email delivery error";
      this.logger.warn(`Resend delivery failed for ${email}: ${message}`);
      this.logger.log(`Magic link preview fallback for ${email}: ${url}`);
      return { delivered: false, previewUrl: url };
    }

    return { delivered: true, previewUrl: undefined };
  }
}
