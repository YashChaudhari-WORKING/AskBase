import { z } from "zod";

export const UpdateBotConfigSchema = z.object({
  botName: z.string().min(1).max(100).optional(),
  welcomeMessage: z.string().max(500).optional(),
  fallbackMessage: z.string().max(500).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  maxContextMessages: z.number().min(1).max(50).optional(),
  systemPrompt: z.string().max(2000).optional(),
  allowedDomains: z.array(z.string()).optional(),
});

export type UpdateBotConfigInput = z.infer<typeof UpdateBotConfigSchema>;
