import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <PageWrapper className="py-10">
      <Card className="p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">
          Política de privacitat
        </h1>
        <p className="mt-4 text-sm text-[color:var(--color-text-muted)]">
          PLAIner utilitza les teves dades per personalitzar itineraris i gestionar
          el teu compte. No venem dades a tercers. Pots sol·licitar l’eliminació
          del compte en qualsevol moment.
        </p>
      </Card>
    </PageWrapper>
  );
}

