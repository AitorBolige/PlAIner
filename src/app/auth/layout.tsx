export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-[color:var(--surface-2)]">
      <div className="relative h-full w-full max-w-[480px] overflow-hidden border-x border-border bg-bg">
        {children}
      </div>
    </div>
  );
}
