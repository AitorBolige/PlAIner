export default function TripDetailLoading() {
  return (
    <div className="flex min-h-dvh justify-center bg-[color:var(--surface-2)]">
      <div className="relative min-h-dvh w-full max-w-[480px] overflow-hidden border-x border-border bg-bg pb-24">
        <div
          className="skeleton h-[260px] w-full"
          style={{ borderRadius: 0 }}
        />
        <div className="px-4 pt-5">
          <div className="skeleton h-28 w-full rounded-[var(--r-xl)]" />
          <div className="skeleton mt-6 h-44 w-full rounded-[var(--r-xl)]" />
          <div className="skeleton mt-4 h-6 w-32" />
          <div className="skeleton mt-3 h-32 w-full rounded-[var(--r-xl)]" />
        </div>
      </div>
    </div>
  );
}
