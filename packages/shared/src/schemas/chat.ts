import { z } from "zod";

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
});

export const ResolveConversationSchema = z.object({
  conversationId: z.string().uuid(),
  resolution: z.string().min(1),
  saveAsLearned: z.boolean().default(true),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type ResolveConversationInput = z.infer<typeof ResolveConversationSchema>;
