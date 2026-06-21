"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TrendingUp, MessageSquare, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Overview {
  totalConversations: number;
  resolvedConversations: number;
  totalHandoffs: number;
  aiResolutionRate: string;
  learnedResponses: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api.get("/analytics/overview").then(res => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance insights for your AI support</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance insights for your AI support</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Resolution Rate</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{data.aiResolutionRate}%</div>
            <p className="text-sm text-muted-foreground mt-2">Queries resolved without human intervention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalConversations}</div>
            <p className="text-sm text-muted-foreground mt-2">{data.resolvedConversations} resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Human Handoffs</CardTitle>
            <Users className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalHandoffs}</div>
            <p className="text-sm text-muted-foreground mt-2">Escalated to human agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Learned Responses</CardTitle>
            <BookOpen className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.learnedResponses}</div>
            <p className="text-sm text-muted-foreground mt-2">Patterns captured from agent resolutions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
