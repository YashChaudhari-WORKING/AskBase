"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { FlowBuilder } from "@/components/flow/FlowBuilder";
import type { FlowData } from "@/components/flow/types";

export default function FlowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/flows/${id}`)
      .then(r => setFlow(r.data.data))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">Flow not found</p>
          <button
            onClick={() => router.push("/dashboard/flows")}
            className="mt-3 text-xs text-primary hover:underline"
          >
            Back to flows
          </button>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="h-full flex flex-col">
        <Skeleton className="h-[52px] rounded-none border-b border-border flex-shrink-0" />
        <div className="flex-1 flex min-h-0">
          <Skeleton className="w-[200px] rounded-none border-r border-border" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground/30 text-sm">Loading flow…</div>
          </div>
        </div>
      </div>
    );
  }

  return <FlowBuilder flow={flow} />;
}
