import type { Request, Response } from "express";
import { db, botConfigs, projects, widgetThemes } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { UpdateBotConfigSchema } from "@askbase/shared";
import { success, error } from "../../common/utils/response";

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "16px",
  "2xl": "20px",
};

export async function getConfig(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId ?? (req as any).user?.tenantId;
    const projectId = (req as any).projectId as string | null;

    let projectData: typeof projects.$inferSelect | null = null;
    let themeData: typeof widgetThemes.$inferSelect | null = null;

    if (projectId) {
      const [proj] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)))
        .limit(1);

      if (proj) {
        projectData = proj;

        if (proj.widgetThemeId) {
          const [theme] = await db
            .select()
            .from(widgetThemes)
            .where(eq(widgetThemes.id, proj.widgetThemeId))
            .limit(1);
          themeData = theme ?? null;
        }
      }
    }

    return success(res, {
      // Bot identity
      name: projectData?.name ?? "Assistant",
      welcomeMessage: projectData?.welcomeMessage ?? "Hi! How can I help you today?",
      primaryColor: projectData?.primaryColor ?? "#6366f1",
      botAvatarEmoji: projectData?.botAvatarEmoji ?? "💬",
      botAvatarUrl: projectData?.botAvatarUrl ?? null,
      botSubtitle: projectData?.botSubtitle ?? "",

      // Behaviour
      widgetPosition: projectData?.widgetPosition ?? "bottom-right",
      openingMessages: projectData?.openingMessages ?? [],
      repeatMessages: projectData?.repeatMessages ?? false,

      // Home tab
      homeGreeting: projectData?.homeGreeting ?? "Hi! How can we help?",
      homeSubgreeting: projectData?.homeSubgreeting ?? "We usually reply in a few minutes.",
      conversationStarters: projectData?.conversationStarters ?? [],

      // Chat
      inputPlaceholder: projectData?.inputPlaceholder ?? "Type a message…",
      widgetQuickReplies: projectData?.widgetQuickReplies ?? [],
      allowAttachments: projectData?.allowAttachments ?? false,

      // Help center
      showHelpCenter: projectData?.showHelpCenter ?? false,
      helpCenterTitle: projectData?.helpCenterTitle ?? "Help & Resources",
      helpArticles: projectData?.helpArticles ?? [],
      helpCenterUrl: projectData?.helpCenterUrl ?? null,

      // Footer
      showPoweredBy: projectData?.showPoweredBy ?? true,
      footerText: projectData?.footerText ?? "Powered by AskBase",
      footerLinkUrl: projectData?.footerLinkUrl ?? "",
      businessHoursText: projectData?.businessHoursText ?? "",

      // Resolved theme — widget uses this directly
      theme: themeData
        ? {
            headerBg: themeData.headerBgColor,
            headerText: themeData.headerTextColor,
            chatBg: themeData.chatBgColor,
            botBg: themeData.botBubbleBg,
            botText: themeData.botBubbleText,
            userBg: themeData.userBubbleBg,
            userText: themeData.userBubbleText,
            accent: themeData.primaryColor,
            launcherBg: themeData.launcherBgColor,
            launcherIconUrl: themeData.launcherIconUrl ?? null,
            radius: RADIUS_MAP[themeData.borderRadius] ?? "16px",
            fontSize: themeData.fontSize,
            showTimestamps: themeData.showTimestamps,
          }
        : null,
    });
  } catch (e) {
    return error(res, "Failed to get config", 500);
  }
}

export async function updateConfig(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const parsed = UpdateBotConfigSchema.safeParse(req.body);
    if (!parsed.success) return error(res, parsed.error.message, 400);

    const existing = await db
      .select({ id: botConfigs.id })
      .from(botConfigs)
      .where(eq(botConfigs.tenantId, tenantId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(botConfigs)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(botConfigs.tenantId, tenantId))
        .returning();
      return success(res, updated);
    } else {
      const [created] = await db
        .insert(botConfigs)
        .values({ tenantId, ...parsed.data })
        .returning();
      return success(res, created);
    }
  } catch (e) {
    return error(res, "Failed to update config", 500);
  }
}
