import type { Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { db, widgetThemes } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { success, error } from "../../common/utils/response";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { env } from "../../config/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

export async function listWidgetThemes(req: AuthRequest, res: Response) {
  try {
    const themes = await db
      .select()
      .from(widgetThemes)
      .where(eq(widgetThemes.tenantId, req.user!.tenantId));
    return success(res, themes);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function getWidgetTheme(req: AuthRequest, res: Response) {
  try {
    const [theme] = await db
      .select()
      .from(widgetThemes)
      .where(and(eq(widgetThemes.id, req.params.id), eq(widgetThemes.tenantId, req.user!.tenantId)))
      .limit(1);
    if (!theme) return error(res, "Theme not found", 404);
    return success(res, theme);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function createWidgetTheme(req: AuthRequest, res: Response) {
  try {
    const { name = "My Theme", ...rest } = req.body;
    const [theme] = await db
      .insert(widgetThemes)
      .values({ tenantId: req.user!.tenantId, name, ...rest })
      .returning();
    return success(res, theme, "Theme created", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function updateWidgetTheme(req: AuthRequest, res: Response) {
  try {
    const b = req.body;
    const [updated] = await db
      .update(widgetThemes)
      .set({
        ...(b.name               !== undefined && { name: b.name }),
        ...(b.botName            !== undefined && { botName: b.botName }),
        ...(b.botSubtitle        !== undefined && { botSubtitle: b.botSubtitle }),
        ...(b.botAvatarEmoji     !== undefined && { botAvatarEmoji: b.botAvatarEmoji }),
        ...(b.botAvatarUrl       !== undefined && { botAvatarUrl: b.botAvatarUrl }),
        ...(b.primaryColor       !== undefined && { primaryColor: b.primaryColor }),
        ...(b.headerBgColor      !== undefined && { headerBgColor: b.headerBgColor }),
        ...(b.headerTextColor    !== undefined && { headerTextColor: b.headerTextColor }),
        ...(b.chatBgColor        !== undefined && { chatBgColor: b.chatBgColor }),
        ...(b.borderRadius       !== undefined && { borderRadius: b.borderRadius }),
        ...(b.botBubbleBg        !== undefined && { botBubbleBg: b.botBubbleBg }),
        ...(b.botBubbleText      !== undefined && { botBubbleText: b.botBubbleText }),
        ...(b.userBubbleBg       !== undefined && { userBubbleBg: b.userBubbleBg }),
        ...(b.userBubbleText     !== undefined && { userBubbleText: b.userBubbleText }),
        ...(b.showTimestamps     !== undefined && { showTimestamps: b.showTimestamps }),
        ...(b.launcherPosition   !== undefined && { launcherPosition: b.launcherPosition }),
        ...(b.launcherBgColor    !== undefined && { launcherBgColor: b.launcherBgColor }),
        ...(b.launcherIconEmoji  !== undefined && { launcherIconEmoji: b.launcherIconEmoji }),
        ...(b.launcherIconUrl    !== undefined && { launcherIconUrl: b.launcherIconUrl }),
        ...(b.fontSize           !== undefined && { fontSize: b.fontSize }),
        ...(b.inputPlaceholder   !== undefined && { inputPlaceholder: b.inputPlaceholder }),
        ...(b.sendButtonColor    !== undefined && { sendButtonColor: b.sendButtonColor }),
        ...(b.allowAttachments   !== undefined && { allowAttachments: b.allowAttachments }),
        ...(b.showPoweredBy      !== undefined && { showPoweredBy: b.showPoweredBy }),
        ...(b.footerText         !== undefined && { footerText: b.footerText }),
        ...(b.footerLinkUrl      !== undefined && { footerLinkUrl: b.footerLinkUrl }),
        ...(b.quickReplies       !== undefined && { quickReplies: b.quickReplies }),
        ...(b.homeGreeting       !== undefined && { homeGreeting: b.homeGreeting }),
        ...(b.homeSubgreeting    !== undefined && { homeSubgreeting: b.homeSubgreeting }),
        ...(b.conversationStarters !== undefined && { conversationStarters: b.conversationStarters }),
        ...(b.showHelpCenter     !== undefined && { showHelpCenter: b.showHelpCenter }),
        ...(b.helpCenterTitle    !== undefined && { helpCenterTitle: b.helpCenterTitle }),
        ...(b.helpArticles       !== undefined && { helpArticles: b.helpArticles }),
        ...(b.helpCenterUrl      !== undefined && { helpCenterUrl: b.helpCenterUrl }),
        ...(b.businessHoursText  !== undefined && { businessHoursText: b.businessHoursText }),
        ...(b.customCss          !== undefined && { customCss: b.customCss }),
        updatedAt: new Date(),
      })
      .where(and(eq(widgetThemes.id, req.params.id), eq(widgetThemes.tenantId, req.user!.tenantId)))
      .returning();
    if (!updated) return error(res, "Theme not found", 404);
    return success(res, updated);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function deleteWidgetTheme(req: AuthRequest, res: Response) {
  try {
    await db
      .delete(widgetThemes)
      .where(and(eq(widgetThemes.id, req.params.id), eq(widgetThemes.tenantId, req.user!.tenantId)));
    return success(res, null, "Theme deleted");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function generateWidgetTheme(req: AuthRequest, res: Response) {
  const { businessName = "My Business", description = "", style = "modern" } = req.body;

  const prompt = `You are a UI designer. Generate a professional chat widget theme for this business.

Business: ${businessName}
Description: ${description}
Style: ${style}

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "themeName": "<descriptive theme name>",
  "botName": "<short bot name>",
  "botSubtitle": "<status subtitle, e.g. 'We reply in minutes'>",
  "botAvatarEmoji": "<one relevant emoji>",
  "primaryColor": "<hex>",
  "headerBgColor": "<hex>",
  "headerTextColor": "#ffffff",
  "chatBgColor": "<very light hex>",
  "botBubbleBg": "<light hex>",
  "botBubbleText": "#111827",
  "userBubbleBg": "<same as primaryColor>",
  "userBubbleText": "#ffffff",
  "launcherBgColor": "<same as primaryColor>",
  "sendButtonColor": "<same as primaryColor>",
  "borderRadius": "xl",
  "launcherIconEmoji": "💬",
  "inputPlaceholder": "<context-aware placeholder>",
  "homeGreeting": "<warm, branded welcome message>",
  "homeSubgreeting": "<short helpful subtext>"
}

Pick cohesive colors matching the brand/industry. Dark readable text on light backgrounds.`;

  const parseJSON = (text: string) => {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const json = parseJSON(result.response.text());
    return success(res, json);
  } catch {
    if (!groq) return error(res, "AI service unavailable", 503);
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return only valid JSON, no markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      });
      const json = parseJSON(completion.choices[0]?.message?.content ?? "{}");
      return success(res, json);
    } catch (groqErr: any) {
      return error(res, groqErr.message, 500);
    }
  }
}
