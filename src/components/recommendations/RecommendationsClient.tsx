"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { useInView } from "react-intersection-observer";

import {
  getDestinationImage,
  BLUR_DATA_URL,
  DESTINATIONS,
} from "@/lib/destinations";
import { useLocale } from "@/lib/i18n-client";
import { useDisplayMoney } from "@/lib/use-display-money";
import { localizeCity, type Locale, type Translations } from "@/lib/i18n";
import { NATIONALITIES } from "@/lib/nationalities";

type RecommendationLite = {
  id: string;
  destination: string;
  country: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  people: number;
  totalCost: number;
  status: string;
  createdAt: string;
  isOwn: boolean;
  author: {
    nickname: string | null;
    nationality: string | null;
    image: string | null;
  };
};

const BUDGET_FILTER_VALUES = [500, 1000, 2000, 5000] as const;

const DAYS_OPTIONS = [
  { label: "1–3 dies", min: 1, max: 3 },
  { label: "4–7 dies", min: 4, max: 7 },
  { label: "8–14 dies", min: 8, max: 14 },
  { label: "15+ dies", min: 15, max: 999 },
];

const PEOPLE_OPTIONS = [1, 2, 3, 4, 5];

export default function RecommendationsClient() {
  const { locale, t } = useLocale();
  const displayMoney = useDisplayMoney();
  const budgetOptions = React.useMemo(
    () =>
      BUDGET_FILTER_VALUES.map((value) => ({
        value,
        label: `< ${displayMoney(value)}`,
      })),
    [displayMoney],
  );

  // Filters
  const [destination, setDestination] = React.useState("");
  const [minBudget, setMinBudget] = React.useState<number | "">("");
  const [maxBudget, setMaxBudget] = React.useState<number | "">("");
  const [minDays, setMinDays] = React.useState<number | "">("");
  const [maxDays, setMaxDays] = React.useState<number | "">("");
  const [people, setPeople] = React.useState<number | "">("");
  const [sortBy, setSortBy] = React.useState<
    "recent" | "cheapest" | "expensive"
  >("recent");

  // Data
  const [trips, setTrips] = React.useState<RecommendationLite[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  const fetchRecommendations = React.useCallback(
    async (currentCursor: string | null, reset = false) => {
      try {
        const params = new URLSearchParams();
        if (destination) params.set("destination", destination);
        if (minBudget) params.set("minBudget", String(minBudget));
        if (maxBudget) params.set("maxBudget", String(maxBudget));
        if (minDays) params.set("minDays", String(minDays));
        if (maxDays) params.set("maxDays", String(maxDays));
        if (people) params.set("minPeople", String(people));
        if (people) params.set("maxPeople", String(people));
        params.set("sortBy", sortBy);
        if (currentCursor) params.set("cursor", currentCursor);

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (reset) {
          setTrips(data.trips);
        } else {
          setTrips((prev) => [...prev, ...data.trips]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (e) {
        console.error(e);
      }
    },
    [destination, minBudget, maxBudget, minDays, maxDays, people, sortBy],
  );

  // Initial load or filter change
  React.useEffect(() => {
    setLoading(true);
    setCursor(null);
    setHasMore(true);
    fetchRecommendations(null, true).finally(() => setLoading(false));
  }, [fetchRecommendations]);

  // Load more
  React.useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      setLoadingMore(true);
      fetchRecommendations(cursor).finally(() => setLoadingMore(false));
    }
  }, [inView, hasMore, loading, loadingMore, cursor, fetchRecommendations]);

  const clearFilters = () => {
    setDestination("");
    setMinBudget("");
    setMaxBudget("");
    setMinDays("");
    setMaxDays("");
    setPeople("");
    setSortBy("recent");
  };

  const hasActiveFilters =
    destination !== "" || maxBudget !== "" || minDays !== "" || people !== "";

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100dvh",
        paddingBottom: "100px",
      }}
    >
      <div style={{ padding: "56px 20px 20px" }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {t.recommendationsTitle}
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            {t.recommendationsSub}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "0 20px 16px",
        }}
      >
        <button
          onClick={() => setSortBy("recent")}
          className={sortBy === "recent" ? "history-tab-btn-active" : ""}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            height: "36px",
            padding: "0 14px",
            borderRadius: "var(--r-pill)",
            border: sortBy === "recent" ? "none" : "1px solid var(--border-md)",
            background: sortBy === "recent" ? "var(--text)" : "var(--surface)",
            color: sortBy === "recent" ? "var(--bg)" : "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 200ms var(--ease)",
          }}
        >
          {t.sortRecent}
        </button>
        <button
          onClick={() => setSortBy("cheapest")}
          className={sortBy === "cheapest" ? "history-tab-btn-active" : ""}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            height: "36px",
            padding: "0 14px",
            borderRadius: "var(--r-pill)",
            border:
              sortBy === "cheapest" ? "none" : "1px solid var(--border-md)",
            background:
              sortBy === "cheapest" ? "var(--text)" : "var(--surface)",
            color: sortBy === "cheapest" ? "var(--bg)" : "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 200ms var(--ease)",
          }}
        >
          {t.sortCheapest}
        </button>
        <button
          onClick={() => setSortBy("expensive")}
          className={sortBy === "expensive" ? "history-tab-btn-active" : ""}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            height: "36px",
            padding: "0 14px",
            borderRadius: "var(--r-pill)",
            border:
              sortBy === "expensive" ? "none" : "1px solid var(--border-md)",
            background:
              sortBy === "expensive" ? "var(--text)" : "var(--surface)",
            color: sortBy === "expensive" ? "var(--bg)" : "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 200ms var(--ease)",
          }}
        >
          {t.sortExpensive}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              height: "36px",
              padding: "0 14px",
              borderRadius: "var(--r-pill)",
              border: "1px solid rgba(232, 93, 58, 0.3)",
              background: "rgba(232, 93, 58, 0.05)",
              color: "#E85D3A",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <X size={14} /> {t.clearFilters}
          </button>
        )}
      </div>

      {/* Destination chips */}
      <div style={{ padding: "0 0 12px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: "8px",
            paddingLeft: "20px",
          }}
        >
          {t.filterDestination}
        </p>
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            scrollbarWidth: "none",
            padding: "0 20px 4px",
          }}
        >
          {DESTINATIONS.map((d) => {
            const active = destination === d.city;
            return (
              <button
                key={d.id}
                onClick={() => setDestination(active ? "" : d.city)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "36px",
                  padding: "0 12px",
                  borderRadius: "var(--r-pill)",
                  border: active ? "none" : "1px solid var(--border-md)",
                  background: active ? "var(--green)" : "var(--surface)",
                  color: active ? "#fff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms var(--ease)",
                }}
              >
                <span>{d.emoji}</span>
                <span>{localizeCity(d.city, locale)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget chips */}
      <div style={{ padding: "0 20px 12px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: "8px",
          }}
        >
          {t.filterBudget}
        </p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {budgetOptions.map((opt) => {
            const active = maxBudget === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setMaxBudget(active ? "" : opt.value);
                  setMinBudget("");
                }}
                style={{
                  height: "34px",
                  padding: "0 14px",
                  borderRadius: "var(--r-pill)",
                  border: active ? "none" : "1px solid var(--border-md)",
                  background: active ? "var(--green)" : "var(--surface)",
                  color: active ? "#fff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms var(--ease)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* People chips */}
      <div style={{ padding: "0 20px 12px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: "8px",
          }}
        >
          {t.filterPeople}
        </p>
        <div style={{ display: "flex", gap: "6px" }}>
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => setPeople(people === p ? "" : p)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: people === p ? "none" : "1px solid var(--border-md)",
                background: people === p ? "var(--green)" : "var(--surface)",
                color: people === p ? "#fff" : "var(--text-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms var(--ease)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPeople(people === 6 ? "" : 6)}
            style={{
              height: "40px",
              padding: "0 12px",
              borderRadius: "var(--r-pill)",
              border: people === 6 ? "none" : "1px solid var(--border-md)",
              background: people === 6 ? "var(--green)" : "var(--surface)",
              color: people === 6 ? "#fff" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms var(--ease)",
            }}
          >
            6+
          </button>
        </div>
      </div>

      {/* Duration chips */}
      <div style={{ padding: "0 20px 16px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: "8px",
          }}
        >
          {t.filterDuration}
        </p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {DAYS_OPTIONS.map((opt) => {
            const active = minDays === opt.min && maxDays === opt.max;
            return (
              <button
                key={opt.min}
                onClick={() => {
                  if (active) {
                    setMinDays("");
                    setMaxDays("");
                  } else {
                    setMinDays(opt.min);
                    setMaxDays(opt.max);
                  }
                }}
                style={{
                  height: "34px",
                  padding: "0 14px",
                  borderRadius: "var(--r-pill)",
                  border: active ? "none" : "1px solid var(--border-md)",
                  background: active ? "var(--green)" : "var(--surface)",
                  color: active ? "#fff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms var(--ease)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner-green" />
          </div>
        ) : trips.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <MapPin size={28} color="var(--text-muted)" />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              {t.noRecommendations}
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                maxWidth: "280px",
                lineHeight: 1.5,
              }}
            >
              {t.noRecommendationsSub}
            </p>
          </div>
        ) : (
          <>
            {trips.map((trip) => (
              <RecommendationCard
                key={trip.id}
                trip={trip}
                t={t}
                locale={locale}
              />
            ))}
            <div ref={ref} style={{ height: "20px" }}>
              {loadingMore && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px",
                    fontSize: "14px",
                    color: "var(--text-muted)",
                  }}
                >
                  {t.loadingMore}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({
  trip,
  t,
  locale,
}: {
  trip: RecommendationLite;
  t: Translations;
  locale: Locale;
}) {
  const displayMoney = useDisplayMoney();
  const router = useRouter();
  const localizedCity = localizeCity(trip.destination, locale);
  const heroImg =
    trip.imageUrl || getDestinationImage(trip.destination, "hero");

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const flag = trip.author.nationality
    ? NATIONALITIES.find((n) => n.code === trip.author.nationality)?.flag ||
      "🌍"
    : "🌍";

  const authorName = trip.author.nickname || "Anonymous";

  return (
    <div
      className="pl-tap"
      onClick={() => router.push(`/recommendations/${trip.id}`)}
      style={{
        background: trip.isOwn
          ? "linear-gradient(135deg, rgba(13,158,122,0.12) 0%, rgba(13,158,122,0.05) 100%)"
          : "var(--surface)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
        border: trip.isOwn
          ? "1px solid rgba(13,158,122,0.25)"
          : "1px solid var(--border)",
        cursor: "pointer",
      }}
    >
      <div
        style={{ height: "160px", position: "relative", overflow: "hidden" }}
      >
        <Image
          src={heroImg}
          alt={localizedCity}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          style={{ objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {trip.isOwn && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(13,158,122,0.9)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "var(--r-pill)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={10} /> {t.ownTripBadge}
          </div>
        )}
        <div style={{ position: "absolute", bottom: "12px", left: "14px" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            {localizedCity}
          </h3>
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Calendar size={13} color="var(--text-faint)" />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {t.daysCount(days)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Users size={13} color="var(--text-faint)" />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {trip.people}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "14px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: "2px",
              }}
            >
              {t.totalCostLabel}
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              {displayMoney(trip.totalCost)}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--green)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {t.viewDetail} <ChevronRight size={16} />
          </div>
        </div>

        {/* Author info */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {trip.author.image ? (
            <img
              src={trip.author.image}
              alt=""
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "var(--green-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "var(--green)",
                fontWeight: 600,
              }}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {t.authorLabel}{" "}
            <span style={{ fontWeight: 600, color: "var(--text)" }}>
              {authorName}
            </span>{" "}
            {flag}
          </span>
        </div>
      </div>
    </div>
  );
}
