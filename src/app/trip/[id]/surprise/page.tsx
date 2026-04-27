"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { SurpriseReveal } from "@/components/trip/SurpriseReveal";

export default function SurprisePage(props: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    destination: string;
    days: Array<{ dayNumber: number; title: string }>;
  } | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/trips/${props.params.id}/surprise`, {
        method: "POST",
      }).catch(() => null);

      if (!res || !res.ok) {
        const j = (await res?.json().catch(() => null)) as { error?: string } | null;
        if (!ignore) {
          setLoading(false);
          setError(j?.error ?? "No s’ha pogut preparar el mode sorpresa.");
        }
        return;
      }

      const j = (await res.json()) as {
        destination: string;
        days: Array<{ dayNumber: number; title: string }>;
      };

      if (!ignore) {
        setData(j);
        setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [props.params.id]);

  return (
    <PageWrapper className="py-10">
      <div className="mx-auto w-full max-w-3xl">
        {loading ? (
          <Card className="p-10">
            <div className="flex items-center gap-3">
              <Spinner />
              <div>
                <div className="font-display text-lg font-extrabold tracking-wide">
                  Preparant…
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  Un moment. Ho farem especial.
                </div>
              </div>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="font-display text-xl font-extrabold tracking-wide">
              No ho hem pogut completar
            </div>
            <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {error}
            </div>
          </Card>
        ) : data ? (
          <SurpriseReveal
            destination={data.destination}
            days={data.days}
            onSeeBudget={() => router.push(`/trip/${props.params.id}/budget`)}
          />
        ) : null}
      </div>
    </PageWrapper>
  );
}

