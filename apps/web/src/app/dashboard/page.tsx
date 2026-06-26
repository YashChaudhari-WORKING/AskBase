"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageSquare, Users, TrendingUp, BookOpen, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

interface Overview {
  totalConversations: number;
  resolvedConversations: number;
  totalHandoffs: number;
  aiResolutionRate: string;
  learnedResponses: number;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    api.get("/analytics/overview")
      .then(res => setOverview(res.data.data))
      .catch(() => {});
  }, []);

  const stats = overview ? [
    { label: "Total Conversations", value: overview.totalConversations, icon: MessageSquare, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
    { label: "AI Resolution Rate", value: `${overview.aiResolutionRate}%`, icon: TrendingUp, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10" },
    { label: "Human Handoffs", value: overview.totalHandoffs, icon: Users, color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10" },
    { label: "Learned Responses", value: overview.learnedResponses, icon: BookOpen, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
  ] : [];

  usePageHeader(
    <PageHeaderBar
      icon={LayoutGrid}
      tone="primary"
      title="Overview"
      stats={overview ? [
        { icon: MessageSquare, value: overview.totalConversations, label: "conversations" },
        { icon: TrendingUp, value: `${overview.aiResolutionRate}%`, label: "AI resolved", tone: "emerald" },
        { icon: Users, value: overview.totalHandoffs, label: "handoffs" },
      ] : []}
    />,
    [overview],
  );

  return (
    <div className="p-8">
      {overview === null ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
