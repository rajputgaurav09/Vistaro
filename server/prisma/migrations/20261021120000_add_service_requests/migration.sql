-- CreateTable
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "indicative_process" TEXT[],
    "scope_boundaries" TEXT[],
    "key_fields" TEXT[],
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_user_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "service_type" TEXT NOT NULL,
    "service_slug" TEXT NOT NULL,
    "brief_details" TEXT NOT NULL,
    "target_audience" TEXT,
    "preferred_dates" TEXT,
    "location" TEXT,
    "budget_range" TEXT,
    "assets_link" TEXT,
    "additional_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "assigned_to_user_id" TEXT,
    "assigned_to_name" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customer_user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id")
);

-- CreateTable
CREATE TABLE "service_quotes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_request_id" TEXT NOT NULL UNIQUE,
    "scope" TEXT NOT NULL,
    "deliverables" TEXT[],
    "timeline" TEXT NOT NULL,
    "exclusions" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "validity_date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "decline_reason" TEXT,
    FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "service_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_request_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE
);
