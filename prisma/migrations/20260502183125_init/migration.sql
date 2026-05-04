-- CreateEnum
CREATE TYPE "TravelSearchStatus" AS ENUM ('PENDING', 'READY', 'STALE', 'ERROR');

-- CreateEnum
CREATE TYPE "TravelOfferType" AS ENUM ('HOTEL', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "TravelRefreshRunStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "ageGroup" TEXT,
    "travelStyles" TEXT[],
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "preferredDuration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "flightCost" DOUBLE PRECISION NOT NULL,
    "hotelCost" DOUBLE PRECISION NOT NULL,
    "activitiesCost" DOUBLE PRECISION NOT NULL,
    "dailyCost" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isSurprise" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelSearch" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "people" INTEGER NOT NULL DEFAULT 2,
    "budgetMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "TravelSearchStatus" NOT NULL DEFAULT 'PENDING',
    "refreshedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelOffer" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "type" "TravelOfferType" NOT NULL,
    "provider" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "bookingUrl" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "imageUrl" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "availabilityText" TEXT,
    "metadata" JSONB,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRefreshRun" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "status" "TravelRefreshRunStatus" NOT NULL DEFAULT 'PENDING',
    "providerSummary" TEXT,
    "requestPayload" JSONB,
    "errorMessage" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelRefreshRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT,
    "duration" INTEGER,
    "cost" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TravelSearch_cacheKey_key" ON "TravelSearch"("cacheKey");

-- CreateIndex
CREATE INDEX "TravelSearch_destination_startDate_endDate_idx" ON "TravelSearch"("destination", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "TravelSearch_expiresAt_idx" ON "TravelSearch"("expiresAt");

-- CreateIndex
CREATE INDEX "TravelOffer_searchId_type_rank_idx" ON "TravelOffer"("searchId", "type", "rank");

-- CreateIndex
CREATE INDEX "TravelOffer_provider_idx" ON "TravelOffer"("provider");

-- CreateIndex
CREATE INDEX "TravelRefreshRun_searchId_startedAt_idx" ON "TravelRefreshRun"("searchId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Day_tripId_dayNumber_key" ON "Day"("tripId", "dayNumber");

-- CreateIndex
CREATE INDEX "Activity_dayId_order_idx" ON "Activity"("dayId", "order");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelOffer" ADD CONSTRAINT "TravelOffer_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "TravelSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRefreshRun" ADD CONSTRAINT "TravelRefreshRun_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "TravelSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
