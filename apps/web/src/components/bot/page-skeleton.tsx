"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full max-w-md" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  )
}
