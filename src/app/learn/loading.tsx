import { SubjectCardSkeleton } from '@/components/ui/Skeleton';

export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-navy pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SubjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
