export default function TripsLoading() {
  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <div className="relative min-h-dvh w-full max-w-[480px] overflow-hidden border-x border-border bg-bg">
        <div className="px-5 pb-5 pt-14">
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton mt-3 h-8 w-48" />
        </div>
        <div className="flex gap-2 px-5 pb-5">
          {[64, 80, 72, 76].map((w, i) => (
            <div
              key={i}
              className="skeleton h-9"
              style={{ width: w, borderRadius: 9999 }}
            />
          ))}
        </div>
        <div className="grid gap-3.5 px-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[var(--r-xl)] border border-border bg-surface"
            >
              <div
                className="skeleton h-40 w-full"
                style={{ borderRadius: 0 }}
              />
              <div className="grid gap-2 p-4">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
