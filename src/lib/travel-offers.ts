import {
  Prisma,
  TravelOfferType,
  TravelRefreshRunStatus,
  TravelSearchStatus,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const offerTypeSchema = z.enum(["hotel", "transport"]);

const baseQuerySchema = z.object({
  destination: z.string().trim().min(1),
  origin: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  countryCode: z.string().trim().length(2).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  people: z.coerce.number().int().positive().default(2),
  budgetMax: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  currency: z.string().trim().length(3).default("EUR"),
});

export const travelOfferQuerySchema = baseQuerySchema.superRefine(
  (query, ctx) => {
    if (query.startDate && query.endDate && query.endDate < query.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be on or after startDate",
      });
    }
  },
);

export const travelOfferSchema = z.object({
  type: offerTypeSchema,
  provider: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().length(3).default("EUR"),
  bookingUrl: z.string().url(),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().nonnegative().optional(),
  availabilityText: z.string().trim().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  rank: z.coerce.number().int().default(0),
  fetchedAt: z.coerce.date().optional(),
});

export type TravelOfferQuery = z.infer<typeof travelOfferQuerySchema>;
export type TravelOfferInput = z.infer<typeof travelOfferSchema>;

export type TravelSearchSnapshot = {
  search: {
    id: string;
    cacheKey: string;
    destination: string;
    city: string | null;
    countryCode: string | null;
    startDate: Date | null;
    endDate: Date | null;
    people: number;
    budgetMax: number | null;
    origin: string | null;
    maxPrice: number | null;
    currency: string;
    status: TravelSearchStatus;
    refreshedAt: Date | null;
    expiresAt: Date | null;
    isStale: boolean;
  } | null;
  offers: Array<{
    id: string;
    type: TravelOfferType;
    provider: string;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    bookingUrl: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    rating: number | null;
    reviewCount: number | null;
    availabilityText: string | null;
    metadata: Prisma.JsonValue | null;
    rank: number;
    fetchedAt: Date;
  }>;
};

export function buildTravelSearchCacheKey(query: TravelOfferQuery) {
  return JSON.stringify({
    destination: query.destination.trim().toLowerCase(),
    origin: query.origin?.trim().toUpperCase() ?? null,
    city: query.city?.trim().toLowerCase() ?? null,
    countryCode: query.countryCode?.trim().toUpperCase() ?? null,
    startDate: query.startDate
      ? query.startDate.toISOString().slice(0, 10)
      : null,
    endDate: query.endDate ? query.endDate.toISOString().slice(0, 10) : null,
    people: query.people,
    budgetMax: query.budgetMax ?? null,
    maxPrice: query.maxPrice ?? null,
    currency: query.currency.trim().toUpperCase(),
  });
}

export function serializeTravelSearchQuery(
  query: TravelOfferQuery,
): Prisma.JsonObject {
  return {
    destination: query.destination.trim(),
    origin: query.origin?.trim() ?? null,
    city: query.city?.trim() ?? null,
    countryCode: query.countryCode?.trim().toUpperCase() ?? null,
    startDate: query.startDate ? query.startDate.toISOString() : null,
    endDate: query.endDate ? query.endDate.toISOString() : null,
    people: query.people,
    budgetMax: query.budgetMax ?? null,
    maxPrice: query.maxPrice ?? null,
    currency: query.currency.trim().toUpperCase(),
  };
}

function getTravelOffersTtlHours() {
  const raw = Number(process.env.TRAVEL_OFFERS_TTL_HOURS ?? "12");
  return Number.isFinite(raw) && raw > 0 ? raw : 12;
}

function getTravelOffersExpiryDate(now = new Date()) {
  return new Date(now.getTime() + getTravelOffersTtlHours() * 60 * 60 * 1000);
}

function toSearchSnapshot(
  search: {
    id: string;
    cacheKey: string;
    destination: string;
    city: string | null;
    countryCode: string | null;
    startDate: Date | null;
    endDate: Date | null;
    people: number;
    budgetMax: number | null;
    origin: string | null;
    maxPrice: number | null;
    currency: string;
    status: TravelSearchStatus;
    refreshedAt: Date | null;
    expiresAt: Date | null;
  } | null,
  offers: Array<{
    id: string;
    type: TravelOfferType;
    provider: string;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    bookingUrl: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    rating: number | null;
    reviewCount: number | null;
    availabilityText: string | null;
    metadata: Prisma.JsonValue | null;
    rank: number;
    fetchedAt: Date;
  }>,
): TravelSearchSnapshot {
  return {
    search: search
      ? {
          ...search,
          isStale:
            !search.expiresAt || search.expiresAt.getTime() <= Date.now(),
        }
      : null,
    offers,
  };
}

export async function getTravelSearchSnapshot(query: TravelOfferQuery) {
  const cacheKey = buildTravelSearchCacheKey(query);
  const search = await prisma.travelSearch.findUnique({
    where: { cacheKey },
    include: {
      offers: {
        orderBy: [{ rank: "asc" }, { price: "asc" }, { fetchedAt: "desc" }],
      },
    },
  });

  return toSearchSnapshot(
    search
      ? {
          id: search.id,
          cacheKey: search.cacheKey,
          destination: search.destination,
          city: search.city,
          countryCode: search.countryCode,
          startDate: search.startDate,
          endDate: search.endDate,
          people: search.people,
          budgetMax: search.budgetMax,
          origin: search.origin ?? null,
          maxPrice: search.maxPrice ?? null,
          currency: search.currency,
          status: search.status,
          refreshedAt: search.refreshedAt,
          expiresAt: search.expiresAt,
        }
      : null,
    search?.offers ?? [],
  );
}

export async function upsertTravelSearchOffers(
  query: TravelOfferQuery,
  offers: TravelOfferInput[],
  options?: {
    providerSummary?: string;
    startedAt?: Date;
    status?: TravelRefreshRunStatus;
    errorMessage?: string;
  },
) {
  const normalizedQuery = travelOfferQuerySchema.parse(query);
  const now = new Date();
  const cacheKey = buildTravelSearchCacheKey(normalizedQuery);
  const startedAt = options?.startedAt ?? now;
  const status = options?.status ?? TravelRefreshRunStatus.SUCCESS;
  const expiresAt = getTravelOffersExpiryDate(now);

  const result = await prisma.$transaction(async (tx) => {
    const search = await tx.travelSearch.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        destination: normalizedQuery.destination,
        origin: normalizedQuery.origin ?? null,
        city: normalizedQuery.city ?? null,
        countryCode: normalizedQuery.countryCode?.toUpperCase() ?? null,
        startDate: normalizedQuery.startDate ?? null,
        endDate: normalizedQuery.endDate ?? null,
        people: normalizedQuery.people,
        budgetMax: normalizedQuery.budgetMax ?? null,
        maxPrice: normalizedQuery.maxPrice ?? null,
        currency: normalizedQuery.currency.toUpperCase(),
        status:
          status === TravelRefreshRunStatus.ERROR
            ? TravelSearchStatus.ERROR
            : TravelSearchStatus.READY,
        refreshedAt: now,
        expiresAt,
      },
      update: {
        destination: normalizedQuery.destination,
        origin: normalizedQuery.origin ?? null,
        city: normalizedQuery.city ?? null,
        countryCode: normalizedQuery.countryCode?.toUpperCase() ?? null,
        startDate: normalizedQuery.startDate ?? null,
        endDate: normalizedQuery.endDate ?? null,
        people: normalizedQuery.people,
        budgetMax: normalizedQuery.budgetMax ?? null,
        maxPrice: normalizedQuery.maxPrice ?? null,
        currency: normalizedQuery.currency.toUpperCase(),
        status:
          status === TravelRefreshRunStatus.ERROR
            ? TravelSearchStatus.ERROR
            : TravelSearchStatus.READY,
        refreshedAt: now,
        expiresAt,
      },
    });

    await tx.travelOffer.deleteMany({ where: { searchId: search.id } });

    if (offers.length > 0) {
      await tx.travelOffer.createMany({
        data: offers.map((offer) => ({
          searchId: search.id,
          type: offer.type.toUpperCase() as TravelOfferType,
          provider: offer.provider,
          title: offer.title,
          description: offer.description ?? null,
          price: offer.price,
          currency: offer.currency.toUpperCase(),
          bookingUrl: offer.bookingUrl,
          sourceUrl: offer.sourceUrl ?? null,
          imageUrl: offer.imageUrl ?? null,
          rating: offer.rating ?? null,
          reviewCount: offer.reviewCount ?? null,
          availabilityText: offer.availabilityText ?? null,
          metadata: offer.metadata ?? Prisma.JsonNull,
          rank: offer.rank,
          fetchedAt: offer.fetchedAt ?? now,
        })),
      });
    }

    await tx.travelRefreshRun.create({
      data: {
        searchId: search.id,
        status,
        providerSummary: options?.providerSummary ?? null,
        requestPayload: serializeTravelSearchQuery(normalizedQuery),
        errorMessage: options?.errorMessage ?? null,
        resultCount: offers.length,
        startedAt,
        finishedAt: now,
      },
    });

    return tx.travelSearch.findUnique({
      where: { id: search.id },
      include: {
        offers: {
          orderBy: [{ rank: "asc" }, { price: "asc" }, { fetchedAt: "desc" }],
        },
      },
    });
  });

  return toSearchSnapshot(
    result
      ? {
          id: result.id,
          cacheKey: result.cacheKey,
          destination: result.destination,
          city: result.city,
          countryCode: result.countryCode,
          startDate: result.startDate,
          endDate: result.endDate,
          people: result.people,
          budgetMax: result.budgetMax,
          origin: result.origin ?? null,
          maxPrice: result.maxPrice ?? null,
          currency: result.currency,
          status: result.status,
          refreshedAt: result.refreshedAt,
          expiresAt: result.expiresAt,
        }
      : null,
    result?.offers ?? [],
  );
}
