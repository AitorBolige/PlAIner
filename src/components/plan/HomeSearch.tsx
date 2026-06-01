"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Plane,
  ArrowRight,
  Users,
  Wallet,
  Sparkles,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";

import { usePlan, type AgeGroup } from "@/components/plan/PlanProvider";
import {
  DestinationSheet,
  DatesSheet,
  TransportSheet,
  BudgetSheet,
  OriginSheet,
} from "@/components/plan/sheets";
import { VoiceButton } from "@/components/plan/VoiceButton";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { formatDateRangeLocalized, groupThousands, getBudgetZone } from "@/lib/plan";
import { DESTINATIONS, BLUR_DATA_URL } from "@/lib/destinations";
import { useLocale } from "@/lib/i18n-client";
import { useDisplayMoney } from "@/lib/use-display-money";
import { localizeCity, localizeCountry } from "@/lib/i18n";

type SheetKind = "dest" | "dates" | "transport" | "origin" | "budget" | null;

const AGE_GROUPS: { id: AgeGroup; emoji: string }[] = [
  { id: "minor", emoji: "🧒" },
  { id: "young", emoji: "🧑" },
  { id: "adult", emoji: "👨" },
  { id: "senior", emoji: "👴" },
];

function ageGroupLabelRange(id: AgeGroup, t: ReturnType<typeof useLocale>["t"]): string {
  switch (id) {
    case "minor": return t.ageMinorRange;
    case "young": return t.ageYoungRange;
    case "adult": return t.ageAdultRange;
    case "senior": return t.ageSeniorRange;
  }
}

function IconSquare({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-[12px]"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

function Row({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  placeholder,
  badge,
  first,
  noBorder,
  onClick,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string | null;
  sub?: string | null;
  placeholder: string;
  badge?: string | null;
  first?: boolean;
  noBorder?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pl-tap flex w-full items-center gap-3 px-4 text-left transition-colors hover:bg-[color:var(--surface-2)] active:bg-[color:var(--surface-2)]"
      style={{
        minHeight: 64,
        borderTop: first || noBorder ? "none" : "1px solid var(--border)",
      }}
    >
      <IconSquare color={iconColor} bg={iconBg}>
        {icon}
      </IconSquare>
      <span className="min-w-0 flex-1">
        <span className="micro block">{label}</span>
        <span
          className="display mt-0.5 block truncate text-[15px] font-semibold"
          style={{ color: value ? "var(--text)" : "var(--text-muted)" }}
        >
          {value || placeholder}
        </span>
        {sub ? <span className="block truncate text-xs text-muted">{sub}</span> : null}
      </span>
      {badge ? (
        <span className="rounded-full bg-[color:var(--gold-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--gold)]">
          {badge}
        </span>
      ) : null}
      <ArrowRight size={16} className="flex-none text-faint" />
    </button>
  );
}

function CircBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text transition disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function AgeGroupChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200"
      style={{
        background: selected ? "var(--green-subtle)" : "var(--surface-2)",
        color: selected ? "var(--green-deep)" : "var(--text-muted)",
        border: selected ? "1.5px solid var(--green)" : "1.5px solid var(--border)",
      }}
    >
      <span>{label}</span>
    </button>
  );
}

export function HomeSearch() {
  const plan = usePlan();
  const { locale, t } = useLocale();
  const {
    destination,
    dates,
    transport,
    origin,
    people,
    budget,
    preferences,
    travelerAgeGroups,
    ready,
    setPeople,
    setPreferences,
    setDestination,
    setTravelerAgeGroup,
    setStep,
  } = plan;

  const [sheet, setSheet] = React.useState<SheetKind>(null);
  const [ageExpanded, setAgeExpanded] = React.useState(false);
  const fmtDates = formatDateRangeLocalized(dates?.start, dates?.end, dates?.days, t);
  const reduce = useReducedMotion();

  const bZone = getBudgetZone(budget, t);
  const displayMoney = useDisplayMoney();

  // Staggered entrance for the main blocks — subtle, not flashy.
  const container = reduce
    ? {}
    : {
        initial: "hidden",
        animate: "show",
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
        },
      };
  const item = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 12 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
          },
        },
      };

  return (
    <motion.div {...container} className="min-h-dvh overflow-y-auto bg-bg pb-28">
      {/* Header with account menu */}
      <motion.div {...item}>
        <PlanHeader />
      </motion.div>

      {/* Voice */}
      <motion.div {...item}>
        <VoiceButton />
      </motion.div>

      {/* Form card */}
      <motion.div
        {...item}
        className="mx-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lg)]"
      >
        <Row
          first
          icon={<MapPin size={18} />}
          iconColor="var(--green)"
          iconBg="var(--green-subtle)"
          label={t.destination}
          value={destination ? localizeCity(destination.id, locale) : undefined}
          sub={destination ? localizeCountry(destination.countryCode, locale) : undefined}
          placeholder={t.whichDestination}
          onClick={() => setSheet("dest")}
        />
        <Row
          icon={<Calendar size={18} />}
          iconColor="var(--blue)"
          iconBg="var(--blue-subtle)"
          label={t.dates}
          value={fmtDates}
          placeholder={t.whenTravel}
          onClick={() => setSheet("dates")}
        />
        <Row
          icon={<Plane size={18} />}
          iconColor="var(--coral)"
          iconBg="var(--coral-subtle)"
          label={t.transport}
          value={transport?.label}
          sub={transport?.sub}
          placeholder={t.howTravel}
          onClick={() => setSheet("transport")}
        />
        <Row
          icon={<ArrowRight size={18} />}
          iconColor="var(--blue)"
          iconBg="var(--blue-subtle)"
          label={t.origin}
          value={origin}
          placeholder={t.originPlaceholder}
          onClick={() => setSheet("origin")}
        />

        {/* People stepper + age groups */}
        <div
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-3 px-4"
            style={{ minHeight: 64 }}
          >
            <IconSquare color="var(--coral)" bg="var(--coral-subtle)">
              <Users size={18} />
            </IconSquare>
            <div className="min-w-0 flex-1">
              <div className="micro">{t.people}</div>
              <div className="display mt-0.5 text-[15px] font-semibold text-text">
                {t.peopleCount(people)}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CircBtn disabled={people <= 1} onClick={() => setPeople(Math.max(1, people - 1))}>
                <Minus size={16} />
              </CircBtn>
              <span className="display min-w-[22px] text-center text-lg font-extrabold text-text">
                {people}
              </span>
              <CircBtn disabled={people >= 12} onClick={() => setPeople(Math.min(12, people + 1))}>
                <Plus size={16} />
              </CircBtn>
            </div>
          </div>

          {/* Age groups expand/collapse toggle */}
          <button
            type="button"
            onClick={() => setAgeExpanded((p) => !p)}
            className="flex w-full items-center gap-2 px-4 pb-2 pt-0 text-left"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--green)]">
              {t.ageGroupLabel}
            </span>
            <span className="flex-1" />
            <span
              className="text-[11px] font-semibold text-muted"
            >
              {travelerAgeGroups.map((g) => ageGroupLabelRange(g, t)).join(", ")}
            </span>
            <motion.span
              animate={{ rotate: ageExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-faint"
            >
              <ChevronDown size={14} />
            </motion.span>
          </button>

          {/* Age group selectors per traveler */}
          <AnimatePresence>
            {ageExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="grid gap-2 px-4 pb-3">
                  {travelerAgeGroups.map((group, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl bg-[color:var(--surface-2)] px-3 py-2"
                    >
                      <span className="min-w-[72px] text-[12px] font-semibold text-muted">
                        {t.travelerN(i + 1)}
                      </span>
                      <div className="flex flex-1 flex-wrap gap-1.5">
                        {AGE_GROUPS.map((ag) => (
                          <AgeGroupChip
                            key={ag.id}
                            selected={group === ag.id}
                            label={ageGroupLabelRange(ag.id, t)}
                            onClick={() => setTravelerAgeGroup(i, ag.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Row
          noBorder
          icon={<Wallet size={18} />}
          iconColor="var(--gold)"
          iconBg="var(--gold-subtle)"
          label={t.budgetPerPerson}
          value={`${displayMoney(budget)} ${t.person}`}
          badge={bZone.label}
          placeholder=""
          onClick={() => setSheet("budget")}
        />

        {/* Preferences */}
        <div className="px-4 pb-3.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="micro">{t.preferences}</div>
          <div className="mb-2 mt-1 text-xs text-muted">
            {t.preferencesHint}
          </div>
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder={t.preferencesPlaceholder}
            className="w-full resize-none rounded-xl border border-border bg-[color:var(--surface-2)] px-3 py-2.5 text-sm leading-[1.45] text-text outline-none"
          />
          <div className="mt-1.5 text-right text-[11px] text-muted">
            {preferences.length} / 280
          </div>
        </div>
      </motion.div>

      {/* Generate */}
      <motion.div {...item} className="px-4 pt-4">
        <motion.button
          type="button"
          disabled={!ready}
          onClick={() => ready && setStep("generating")}
          whileTap={reduce ? undefined : { scale: 0.985 }}
          className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-full font-display text-base font-bold transition-all"
          style={{
            background: ready ? "var(--green)" : "var(--surface-2)",
            color: ready ? "#fff" : "var(--text-muted)",
            boxShadow: ready ? "var(--shadow-cta)" : "none",
            cursor: ready ? "pointer" : "not-allowed",
          }}
        >
          <Sparkles size={18} style={{ opacity: ready ? 1 : 0.6 }} />
          {ready ? t.generateTrip : t.completeAllFields}
          {ready ? <ArrowRight size={18} /> : null}
        </motion.button>
      </motion.div>

      {/* Popular destinations */}
      <motion.div {...item} className="px-5 pb-2 pt-7">
        <div className="micro text-[color:var(--green)]">{t.popularDestinations}</div>
        <div className="display text-lg font-extrabold tracking-[-0.025em] text-text">
          {t.whereToGo}
        </div>
      </motion.div>
      <motion.div {...item} className="grid grid-cols-2 gap-2.5 px-4">
        {DESTINATIONS.slice(0, 6).map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDestination(d)}
            className="group relative h-[158px] overflow-hidden rounded-2xl border border-border text-left shadow-[0_6px_20px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
          >
            <Image
              src={d.cardImage}
              alt={localizeCity(d.id, locale)}
              fill
              sizes="240px"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(170deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.72) 100%)",
              }}
            />
            <span className="display absolute inset-x-2.5 bottom-2 block text-[13px] font-extrabold tracking-[-0.02em] text-white">
              {localizeCity(d.id, locale)}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Sheets */}
      <DestinationSheet open={sheet === "dest"} onClose={() => setSheet(null)} />
      <DatesSheet open={sheet === "dates"} onClose={() => setSheet(null)} />
      <TransportSheet open={sheet === "transport"} onClose={() => setSheet(null)} />
      <BudgetSheet open={sheet === "budget"} onClose={() => setSheet(null)} />
      <OriginSheet open={sheet === "origin"} onClose={() => setSheet(null)} />
    </motion.div>
  );
}
