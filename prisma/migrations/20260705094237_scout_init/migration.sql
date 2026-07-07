-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('DRAFT', 'SHORTLISTED', 'APPROVED', 'IN_PRODUCTION', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_projects" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bibleText" TEXT,
    "biblePath" TEXT,
    "titleFormulas" TEXT,
    "thumbnailNotes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_channels" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT,
    "channelUrl" TEXT NOT NULL,
    "channelId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_keywords" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seed_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_outliers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "videoId" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "views" BIGINT,
    "likes" BIGINT,
    "comments" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seed_outliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_ideas" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceVideoId" TEXT,
    "sourceTitle" TEXT,
    "sourceUrl" TEXT,
    "remixTitle" TEXT NOT NULL,
    "remixHook" TEXT,
    "remixAngle" TEXT,
    "outlierScore" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "thumbnailPath" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'DRAFT',
    "briefJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_search_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_search_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "channel_projects_userId_idx" ON "channel_projects"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_projects_userId_slug_key" ON "channel_projects"("userId", "slug");

-- CreateIndex
CREATE INDEX "competitor_channels_projectId_idx" ON "competitor_channels"("projectId");

-- CreateIndex
CREATE INDEX "seed_keywords_projectId_idx" ON "seed_keywords"("projectId");

-- CreateIndex
CREATE INDEX "seed_outliers_projectId_idx" ON "seed_outliers"("projectId");

-- CreateIndex
CREATE INDEX "saved_ideas_projectId_idx" ON "saved_ideas"("projectId");

-- CreateIndex
CREATE INDEX "scout_search_runs_projectId_idx" ON "scout_search_runs"("projectId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_projects" ADD CONSTRAINT "channel_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_channels" ADD CONSTRAINT "competitor_channels_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "channel_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_keywords" ADD CONSTRAINT "seed_keywords_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "channel_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_outliers" ADD CONSTRAINT "seed_outliers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "channel_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_ideas" ADD CONSTRAINT "saved_ideas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "channel_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_search_runs" ADD CONSTRAINT "scout_search_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "channel_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
