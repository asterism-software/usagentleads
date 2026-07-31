export default function DashboardLoading() {
  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-white lg:block">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-6 w-32 rounded-md bg-subtle animate-pulse" />
        </div>
        <div className="px-3 py-3 border-b border-border space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded-lg bg-subtle animate-pulse" />
          ))}
        </div>
        <div className="px-3 py-3 space-y-1">
          <div className="h-4 w-16 rounded bg-subtle animate-pulse mx-3 mb-2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 w-full rounded-lg bg-subtle animate-pulse" />
          ))}
        </div>
      </aside>
      <div className="flex-1 p-8 max-sm:p-4 bg-page">
        <div className="mb-8 h-7 w-48 rounded-md bg-subtle animate-pulse" />
        <div className="flex gap-3 mb-6">
          <div className="h-10 flex-1 rounded-lg bg-subtle animate-pulse" />
          <div className="h-10 w-48 rounded-lg bg-subtle animate-pulse" />
        </div>
        <div className="card overflow-hidden">
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-border/60">
                <div className="h-4 rounded-md bg-subtle animate-pulse" style={{ width: `${60 + Math.random() * 20}%`, flexBasis: '25%' }} />
                <div className="h-4 rounded-md bg-subtle animate-pulse" style={{ width: `${50 + Math.random() * 20}%`, flexBasis: '30%' }} />
                <div className="h-4 rounded-md bg-subtle animate-pulse hidden sm:block" style={{ width: `${40 + Math.random() * 20}%`, flexBasis: '25%' }} />
                <div className="h-4 w-10 rounded-md bg-subtle animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
