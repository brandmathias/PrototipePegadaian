CREATE TABLE IF NOT EXISTS "push_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "notification_id" text NOT NULL REFERENCES "notifications"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "status" text DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_deliveries_notification_unique_idx" ON "push_deliveries" ("notification_id");
CREATE INDEX IF NOT EXISTS "push_deliveries_pending_idx" ON "push_deliveries" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "push_deliveries_user_idx" ON "push_deliveries" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_unique_idx" ON "push_subscriptions" ("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");
