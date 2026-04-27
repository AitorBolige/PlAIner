export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No Navbar/Footer in auth screens (mobile-first app feel)
  return <>{children}</>;
}

