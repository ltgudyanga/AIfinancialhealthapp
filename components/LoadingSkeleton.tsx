export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      {/* Header */}
      <div className="glass-panel h-16 border-b border-blue-500/20 sticky top-0" />

      {/* Content */}
      <div className="flex-1 max-w-[1800px] w-full mx-auto p-6 space-y-6">
        {/* AI panel */}
        <div className="h-40 rounded-[2rem] bg-blue-900/30 border border-blue-500/10" />

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-blue-900/30 border border-blue-500/10" />
          ))}
        </div>

        {/* Chart */}
        <div className="h-80 rounded-[2rem] bg-blue-900/30 border border-blue-500/10" />
      </div>

      {/* Footer */}
      <div className="glass-panel h-10 border-t border-blue-500/20" />
    </div>
  );
}
