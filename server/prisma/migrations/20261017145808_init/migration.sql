-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'vendor',
    "phone" TEXT,
    "title" TEXT,
    "organisation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'vendor',
    "registration_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "organisation_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisation_id" TEXT NOT NULL UNIQUE,
    "business_name" TEXT NOT NULL,
    "tagline" TEXT,
    "service_categories" TEXT[],
    "service_areas" TEXT[],
    "description" TEXT,
    "capacity" TEXT,
    "experience_years" INTEGER NOT NULL DEFAULT 1,
    "contact_preferences" JSONB,
    "verified_status" TEXT NOT NULL DEFAULT 'Unverified',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "completed_projects_count" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_portfolio_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendor_profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "client_name" TEXT,
    "year" TEXT,
    "description" TEXT,
    "images" TEXT[],
    "tags" TEXT[],
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("vendor_profile_id") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisation_id" TEXT NOT NULL,
    "organisation_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'tender',
    "scope" TEXT NOT NULL,
    "quantities" TEXT,
    "location" TEXT NOT NULL,
    "budget_min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budget_max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "is_budget_disclosed" BOOLEAN NOT NULL DEFAULT true,
    "publish_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submission_deadline" TIMESTAMP(3) NOT NULL,
    "event_date" TEXT,
    "requirements" JSONB,
    "attachments" JSONB,
    "contact_details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "proposals_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id")
);

-- CreateTable
CREATE TABLE "saved_opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "notes" TEXT,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user_id", "opportunity_id"),
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunity_id" TEXT NOT NULL,
    "vendor_organisation_id" TEXT NOT NULL,
    "vendor_user_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "quote_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "delivery_timeline" TEXT NOT NULL,
    "proposal_summary" TEXT NOT NULL,
    "breakdown" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "readiness_score" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "clarification_threads" JSONB,
    "institution_notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id"),
    FOREIGN KEY ("vendor_organisation_id") REFERENCES "organisations"("id"),
    FOREIGN KEY ("vendor_user_id") REFERENCES "users"("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposal_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "criteria_scores" JSONB NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_review',
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "readiness_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunity_id" TEXT NOT NULL,
    "vendor_organisation_id" TEXT NOT NULL,
    "checklist_items" JSONB NOT NULL,
    "overall_readiness_pct" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "vendor_enquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender_organisation_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "vendor_organisation_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "requirements" TEXT,
    "budget_range" TEXT,
    "needed_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "responses" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sender_user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("vendor_organisation_id") REFERENCES "organisations"("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "related_type" TEXT,
    "related_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
