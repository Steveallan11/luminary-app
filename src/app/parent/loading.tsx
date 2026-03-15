import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function ParentLoading() {
  return (
    <div className="min-h-screen bg-navy pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
      </div>
      <DashboardSkeleton />
    </div>
  );
}
