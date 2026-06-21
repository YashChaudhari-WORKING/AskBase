import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().startsWith("AIza"),
  VOYAGE_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  BREVO_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().default("hello@askbase.io"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
