CREATE TYPE "public"."content_type" AS ENUM('PDF', 'VIDEO', 'PRESENTATION', 'IMAGE', 'LINK', 'WEBINAR');--> statement-breakpoint
CREATE TYPE "public"."earning_status" AS ENUM('PENDING_HOLD', 'AVAILABLE', 'IN_PAYOUT', 'PAID', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'BLOCKED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_status" AS ENUM('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "content_type" NOT NULL,
	"file_key" text,
	"file_size" integer,
	"mime_type" text,
	"url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"tariff_access" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tariff_id" uuid NOT NULL,
	"amount_kopecks" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"external_payment_id" text,
	"provider" text NOT NULL,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_external_payment_id_unique" UNIQUE("external_payment_id")
);
--> statement-breakpoint
CREATE TABLE "payout_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" uuid NOT NULL,
	"earning_id" uuid NOT NULL,
	CONSTRAINT "payout_items_earning_id_unique" UNIQUE("earning_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_kopecks" integer NOT NULL,
	"phone_snapshot" text NOT NULL,
	"method" text DEFAULT 'sbp' NOT NULL,
	"status" "payout_status" DEFAULT 'REQUESTED' NOT NULL,
	"external_payout_id" text,
	"provider" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"source_user_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_kopecks" integer NOT NULL,
	"tariff_slug" text NOT NULL,
	"status" "earning_status" DEFAULT 'PENDING_HOLD' NOT NULL,
	"hold_until" timestamp NOT NULL,
	"available_at" timestamp,
	"reversed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_earnings_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tariff_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"next_payment_at" timestamp,
	"external_sub_id" text,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"price_kopecks" integer NOT NULL,
	"referral_reward_kopecks" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tariffs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vk_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"avatar_url" text,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"referral_code" text NOT NULL,
	"referrer_id" uuid,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"consent_payouts" boolean DEFAULT false NOT NULL,
	"consent_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_vk_id_unique" UNIQUE("vk_id"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"external_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" json NOT NULL,
	"status" "webhook_event_status" DEFAULT 'PENDING' NOT NULL,
	"error" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_user_idx" ON "payouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "earnings_beneficiary_idx" ON "referral_earnings" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE INDEX "earnings_status_idx" ON "referral_earnings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "earnings_hold_until_idx" ON "referral_earnings" USING btree ("hold_until");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_next_payment_idx" ON "subscriptions" USING btree ("next_payment_at");--> statement-breakpoint
CREATE INDEX "users_referrer_idx" ON "users" USING btree ("referrer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_idx" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_external_idx" ON "webhook_events" USING btree ("provider","external_event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_status_idx" ON "webhook_events" USING btree ("status");