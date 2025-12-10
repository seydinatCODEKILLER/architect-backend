-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('Private', 'Unlisted', 'Public');

-- CreateEnum
CREATE TYPE "DiagramType" AS ENUM ('Flowchart', 'Sequence', 'Class', 'ER', 'State', 'Gantt', 'Pie', 'Timeline', 'Quadrant', 'Mindmap');

-- CreateEnum
CREATE TYPE "ADRStatus" AS ENUM ('Draft', 'Proposed', 'Accepted', 'Implemented', 'Superseded', 'Deprecated', 'Rejected');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('ARCHITECTURE_CREATE', 'ARCHITECTURE_UPDATE', 'ARCHITECTURE_DELETE', 'ARCHITECTURE_CLONE', 'ARCHITECTURE_PUBLISH', 'ARCHITECTURE_UNPUBLISH', 'DIAGRAM_CREATE', 'DIAGRAM_UPDATE', 'DIAGRAM_DELETE', 'ADR_CREATE', 'ADR_UPDATE', 'ADR_STATUS_CHANGE', 'FILETREE_UPDATE', 'DOCUMENTATION_UPDATE', 'ARCHITECTURE_VIEW');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('Pending', 'Accepted', 'Declined', 'Expired', 'Revoked');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "authProvider" TEXT,
    "authProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "editorFontSize" INTEGER NOT NULL DEFAULT 14,
    "editorTheme" TEXT NOT NULL DEFAULT 'vs-dark',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "autoSave" BOOLEAN NOT NULL DEFAULT true,
    "saveInterval" INTEGER NOT NULL DEFAULT 5000,
    "defaultView" TEXT NOT NULL DEFAULT 'editor',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "architectures" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'Private',
    "techStack" TEXT[],
    "tags" TEXT[],
    "projectContext" TEXT,
    "objectives" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clones" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "fileTree" JSONB,
    "documentation" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "license" TEXT DEFAULT 'MIT',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "architectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagrams" (
    "id" TEXT NOT NULL,
    "architectureId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiagramType" NOT NULL DEFAULT 'Flowchart',
    "mermaidCode" TEXT NOT NULL,
    "config" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 800,
    "height" INTEGER NOT NULL DEFAULT 600,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adrs" (
    "id" TEXT NOT NULL,
    "architectureId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ADRStatus" NOT NULL DEFAULT 'Proposed',
    "context" TEXT NOT NULL,
    "decisionDrivers" TEXT,
    "consideredOptions" TEXT,
    "decision" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "implementationNotes" TEXT,
    "number" INTEGER NOT NULL,
    "supersededById" TEXT,
    "proposedById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decisionDate" TIMESTAMP(3),

    CONSTRAINT "adrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "architectureId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'Private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "architectureId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "message" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clone_invitations" (
    "id" TEXT NOT NULL,
    "sourceArchitectureId" TEXT NOT NULL,
    "targetArchitectureId" TEXT,
    "invitedUserId" TEXT,
    "invitedEmail" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'Pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clone_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "architectureId" TEXT,
    "diagramId" TEXT,
    "adrId" TEXT,
    "userId" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "architectureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_authProvider_authProviderId_idx" ON "users"("authProvider", "authProviderId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "architectures_slug_key" ON "architectures"("slug");

-- CreateIndex
CREATE INDEX "architectures_userId_idx" ON "architectures"("userId");

-- CreateIndex
CREATE INDEX "architectures_visibility_idx" ON "architectures"("visibility");

-- CreateIndex
CREATE INDEX "architectures_createdAt_idx" ON "architectures"("createdAt");

-- CreateIndex
CREATE INDEX "architectures_slug_idx" ON "architectures"("slug");

-- CreateIndex
CREATE INDEX "architectures_tags_idx" ON "architectures"("tags");

-- CreateIndex
CREATE INDEX "diagrams_architectureId_idx" ON "diagrams"("architectureId");

-- CreateIndex
CREATE INDEX "diagrams_type_idx" ON "diagrams"("type");

-- CreateIndex
CREATE INDEX "diagrams_position_idx" ON "diagrams"("position");

-- CreateIndex
CREATE INDEX "adrs_architectureId_idx" ON "adrs"("architectureId");

-- CreateIndex
CREATE INDEX "adrs_status_idx" ON "adrs"("status");

-- CreateIndex
CREATE INDEX "adrs_proposedById_idx" ON "adrs"("proposedById");

-- CreateIndex
CREATE INDEX "adrs_number_idx" ON "adrs"("number");

-- CreateIndex
CREATE UNIQUE INDEX "adrs_architectureId_number_key" ON "adrs"("architectureId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_key_key" ON "uploaded_files"("key");

-- CreateIndex
CREATE INDEX "uploaded_files_userId_idx" ON "uploaded_files"("userId");

-- CreateIndex
CREATE INDEX "uploaded_files_architectureId_idx" ON "uploaded_files"("architectureId");

-- CreateIndex
CREATE INDEX "uploaded_files_visibility_idx" ON "uploaded_files"("visibility");

-- CreateIndex
CREATE INDEX "uploaded_files_mimeType_idx" ON "uploaded_files"("mimeType");

-- CreateIndex
CREATE INDEX "uploaded_files_createdAt_idx" ON "uploaded_files"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_architectureId_idx" ON "activity_logs"("architectureId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "clone_invitations_token_key" ON "clone_invitations"("token");

-- CreateIndex
CREATE INDEX "clone_invitations_sourceArchitectureId_idx" ON "clone_invitations"("sourceArchitectureId");

-- CreateIndex
CREATE INDEX "clone_invitations_invitedEmail_idx" ON "clone_invitations"("invitedEmail");

-- CreateIndex
CREATE INDEX "clone_invitations_token_idx" ON "clone_invitations"("token");

-- CreateIndex
CREATE INDEX "clone_invitations_expiresAt_idx" ON "clone_invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "clone_invitations_status_idx" ON "clone_invitations"("status");

-- CreateIndex
CREATE INDEX "clone_invitations_createdAt_idx" ON "clone_invitations"("createdAt");

-- CreateIndex
CREATE INDEX "comments_architectureId_idx" ON "comments"("architectureId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "comments_diagramId_idx" ON "comments"("diagramId");

-- CreateIndex
CREATE INDEX "comments_adrId_idx" ON "comments"("adrId");

-- CreateIndex
CREATE INDEX "stars_architectureId_idx" ON "stars"("architectureId");

-- CreateIndex
CREATE INDEX "stars_userId_idx" ON "stars"("userId");

-- CreateIndex
CREATE INDEX "stars_createdAt_idx" ON "stars"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "stars_userId_architectureId_key" ON "stars"("userId", "architectureId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "architectures" ADD CONSTRAINT "architectures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagrams" ADD CONSTRAINT "diagrams_architectureId_fkey" FOREIGN KEY ("architectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adrs" ADD CONSTRAINT "adrs_architectureId_fkey" FOREIGN KEY ("architectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adrs" ADD CONSTRAINT "adrs_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adrs" ADD CONSTRAINT "adrs_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_architectureId_fkey" FOREIGN KEY ("architectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_architectureId_fkey" FOREIGN KEY ("architectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clone_invitations" ADD CONSTRAINT "clone_invitations_sourceArchitectureId_fkey" FOREIGN KEY ("sourceArchitectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clone_invitations" ADD CONSTRAINT "clone_invitations_targetArchitectureId_fkey" FOREIGN KEY ("targetArchitectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clone_invitations" ADD CONSTRAINT "clone_invitations_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_architectureId_fkey" FOREIGN KEY ("architectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_adrId_fkey" FOREIGN KEY ("adrId") REFERENCES "adrs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stars" ADD CONSTRAINT "stars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stars" ADD CONSTRAINT "stars_architectureId_fkey" FOREIGN KEY ("architectureId") REFERENCES "architectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
