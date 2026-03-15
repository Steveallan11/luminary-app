'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  colour?: string;
}

export function Skeleton({ className, colour }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-lg animate-pulse', className)}
      style={{
        background: colour
          ? `linear-gradient(90deg, ${colour}10 25%, ${colour}20 50%, ${colour}10 75%)`
          : 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function SubjectCardSkeleton({ colour }: { colour?: string }) {
  return (
    <div className="rounded-2xl bg-navy-light/60 border border-white/5 p-5">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" colour={colour} />
        <Skeleton className="h-4 w-24 rounded" colour={colour} />
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-2" colour={colour} />
      <Skeleton className="h-3 w-16 rounded" colour={colour} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-navy-light/60 border border-white/10 p-4">
            <Skeleton className="w-8 h-8 rounded-lg mb-3" />
            <Skeleton className="h-6 w-16 rounded mb-1" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
      {/* Subject grid */}
      <div className="rounded-2xl bg-navy-light/60 border border-white/10 p-5">
        <Skeleton className="h-5 w-40 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SubjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LessonChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Lumi message skeleton */}
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1 max-w-[70%]">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
