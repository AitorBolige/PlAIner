import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function CookiesPage() {
  return (
    <PageWrapper className="py-10">
      <Card className="p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">
          Política de cookies
        </h1>
        <p className="mt-4 text-sm text-[color:var(--color-text-muted)]">
          PLAIner utilitza cookies essencials per iniciar sessió, mantenir la
          sessió activa i recordar preferències. No fem servir cookies de
          publicitat en aquest MVP.
        </p>
      </Card>
    </PageWrapper>
  );
}

