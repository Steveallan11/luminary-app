export default function Loading() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-electric/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-electric animate-spin" />
        </div>
        <p className="text-sm text-slate-light/50 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
