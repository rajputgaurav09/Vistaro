-- AlterTable: Add visibility to opportunities
ALTER TABLE "opportunities" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

-- CreateTable: tender_invitations for private tenders
CREATE TABLE "tender_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunity_id" TEXT NOT NULL,
    "vendor_organisation_id" TEXT,
    "vendor_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "token" TEXT UNIQUE,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE,
    FOREIGN KEY ("vendor_organisation_id") REFERENCES "organisations"("id")
);

-- CreateIndex
CREATE INDEX "idx_opportunities_visibility" ON "opportunities"("visibility");
CREATE INDEX "idx_tender_invitations_vendor_org" ON "tender_invitations"("vendor_organisation_id");
CREATE INDEX "idx_tender_invitations_email" ON "tender_invitations"("vendor_email");
