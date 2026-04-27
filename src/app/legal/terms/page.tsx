import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <PageWrapper className="py-10">
      <Card className="p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">
          Termes d’ús
        </h1>
        <p className="mt-4 text-sm text-[color:var(--color-text-muted)]">
          PLAIner proporciona recomanacions i planificació de viatges basades en
          dades d’usuari i generació amb IA. L’usuari és responsable de validar
          requisits, disponibilitat i condicions de reserva abans de comprar.
        </p>
      </Card>
    </PageWrapper>
  );
}

