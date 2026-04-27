import Link from "next/link";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_18%_22%,rgba(232,160,74,0.20),transparent_55%),radial-gradient(1200px_circle_at_80%_35%,rgba(74,144,184,0.18),transparent_60%),linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.65))]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2290%22%20height%3D%2290%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%2290%22%20height%3D%2290%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.35%22/%3E%3C/svg%3E')]" />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance font-display text-5xl font-extrabold tracking-wide md:text-7xl">
              El teu viatge perfecte, sense pensar-hi.
            </h1>
            <p className="mt-6 text-balance text-base text-[color:var(--color-text-muted)] md:text-lg">
              Digues qui ets, quant tens i quants dies vols. PLAIner t’entrega un
              itinerari complet amb el cost total visible en tot moment.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/onboarding">
                <span className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--color-primary)] px-8 text-[14px] font-medium uppercase tracking-[0.08em] text-black transition-colors duration-200 ease-[var(--ease-out-premium)] hover:bg-[color:var(--color-primary-hover)] active:bg-[color:var(--color-primary-active)]">
                  Planifica el teu viatge
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="glass rounded-[var(--radius-xl)] p-8">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              Proposta de valor
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-wide">
              No només cerques. Decideixes.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-muted)] md:text-base">
              PLAIner compara per tu i t’entrega una decisió final: vol, hotel i
              activitats tancades, coherents amb el teu moment vital. El preu no
              és un “a partir de”: és un cost total real, desglossat, i sempre a
              la vista.
            </p>
          </div>

          <div className="glass rounded-[var(--radius-xl)] p-8">
            <div className="font-display text-6xl font-extrabold tracking-wide">
              3
            </div>
            <div className="mt-2 text-sm uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              minuts
            </div>
            <p className="mt-4 text-sm text-[color:var(--color-text-muted)]">
              Per tenir un viatge complet amb pressupost tancat.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            Com funciona
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-wide">
            Inspiració + acció immediata
          </h2>
        </div>

        <div className="glass rounded-[var(--radius-xl)] p-8">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                n: "01",
                t: "Dius qui ets i quant tens",
                d: "Segment, estil i pressupost. Sense fricció.",
              },
              {
                n: "02",
                t: "L’IA genera el pla complet",
                d: "Ritme i activitats adaptades al teu moment vital.",
              },
              {
                n: "03",
                t: "Veus el cost total real",
                d: "Vol, hotel i activitats desglossades.",
              },
              {
                n: "04",
                t: "Reserves amb un clic",
                d: "Enllaços directes per tancar la decisió.",
              },
            ].map((s) => (
              <div key={s.n} className="min-w-0">
                <div className="font-display text-sm font-extrabold tracking-[0.22em] text-[color:var(--color-text-muted)]">
                  {s.n}
                </div>
                <div className="mt-3 text-sm font-semibold">{s.t}</div>
                <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quotes */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              q: "Per fi veig el cost total abans de decidir. És just el que faltava.",
              a: "Clàudia, 28",
            },
            {
              q: "En 5 minuts tenia un itinerari complet que encaixava amb el meu ritme.",
              a: "Jordi, 41",
            },
            {
              q: "Senzill, clar i amb una sensació premium. Em dóna confiança.",
              a: "Montserrat, 57",
            },
          ].map((t, i) => (
            <div
              key={t.a}
              className="glass rounded-[var(--radius-xl)] p-6"
              style={{
                transform: i === 1 ? "translateY(10px)" : i === 2 ? "translateY(20px)" : "translateY(0px)",
              }}
            >
              <div className="text-sm leading-relaxed text-[color:var(--color-text)]">
                “{t.q}”
              </div>
              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                {t.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[var(--radius-xl)] bg-[color:var(--color-primary)] p-10 text-black md:p-14">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr] md:items-center">
            <div>
              <h2 className="font-display text-4xl font-extrabold tracking-wide md:text-5xl">
                Comença ara. És gratis.
              </h2>
              <p className="mt-4 text-sm text-black/75 md:text-base">
                Tanca el viatge perfecte per a TU ara, amb el pressupost sota control.
              </p>
            </div>
            <div className="md:flex md:justify-end">
              <Link href="/onboarding">
                <span className="inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-[14px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-primary)] transition-colors duration-200 ease-[var(--ease-out-premium)] hover:bg-black/90">
                  Comença
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
