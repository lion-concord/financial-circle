import {
  pgTable, pgEnum, uuid, text, integer, boolean,
  timestamp, uniqueIndex, index, json
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "BLOCKED", "SUSPENDED"]);
export const subStatusEnum = pgEnum("subscription_status", ["ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"]);
export const earningStatusEnum = pgEnum("earning_status", ["PENDING_HOLD", "AVAILABLE", "IN_PAYOUT", "PAID", "REVERSED"]);
export const payoutStatusEnum = pgEnum("payout_status", ["REQUESTED", "PROCESSING", "PAID", "FAILED", "CANCELED"]);
export const webhookStatusEnum = pgEnum("webhook_event_status", ["PENDING", "PROCESSED", "FAILED", "SKIPPED"]);
export const contentTypeEnum = pgEnum("content_type", ["PDF", "VIDEO", "PRESENTATION", "IMAGE", "LINK", "WEBINAR"]);

// ─── Users ──────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:             uuid("id").primaryKey().defaultRandom(),
  vkId:           text("vk_id").notNull().unique(),
  firstName:      text("first_name").notNull(),
  lastName:       text("last_name"),
  avatarUrl:      text("avatar_url"),
  phone:          text("phone"),
  phoneVerified:  boolean("phone_verified").notNull().default(false),
  referralCode:   text("referral_code").notNull().unique(),
  referrerId:     uuid("referrer_id"),
  status:         userStatusEnum("status").notNull().default("ACTIVE"),
  consentPayouts: boolean("consent_payouts").notNull().default(false),
  consentData:    boolean("consent_data").notNull().default(false),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  referrerIdx:     index("users_referrer_idx").on(t.referrerId),
  referralCodeIdx: uniqueIndex("users_referral_code_idx").on(t.referralCode),
}));

// ─── Tariffs ────────────────────────────────────────────────────

export const tariffs = pgTable("tariffs", {
  id:                    uuid("id").primaryKey().defaultRandom(),
  slug:                  text("slug").notNull().unique(),   // starter | investor | investor_pro
  name:                  text("name").notNull(),
  priceKopecks:          integer("price_kopecks").notNull(),
  referralRewardKopecks: integer("referral_reward_kopecks").notNull().default(0),
  isActive:              boolean("is_active").notNull().default(true),
  createdAt:             timestamp("created_at").notNull().defaultNow(),
});

// ─── Subscriptions ──────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             uuid("user_id").notNull().unique(),
  tariffId:           uuid("tariff_id").notNull(),
  status:             subStatusEnum("status").notNull().default("ACTIVE"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd:   timestamp("current_period_end").notNull(),
  nextPaymentAt:      timestamp("next_payment_at"),
  externalSubId:      text("external_sub_id"),
  canceledAt:         timestamp("canceled_at"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  statusIdx:       index("subscriptions_status_idx").on(t.status),
  nextPaymentIdx:  index("subscriptions_next_payment_idx").on(t.nextPaymentAt),
}));

// ─── Payments ───────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id:                uuid("id").primaryKey().defaultRandom(),
  userId:            uuid("user_id").notNull(),
  tariffId:          uuid("tariff_id").notNull(),
  amountKopecks:     integer("amount_kopecks").notNull(),
  periodStart:       timestamp("period_start").notNull(),
  periodEnd:         timestamp("period_end").notNull(),
  status:            paymentStatusEnum("status").notNull().default("PENDING"),
  externalPaymentId: text("external_payment_id").unique(),
  provider:          text("provider").notNull(),
  paidAt:            timestamp("paid_at"),
  refundedAt:        timestamp("refunded_at"),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx:   index("payments_user_idx").on(t.userId),
  statusIdx: index("payments_status_idx").on(t.status),
}));

// ─── Referral Earnings ──────────────────────────────────────────

export const referralEarnings = pgTable("referral_earnings", {
  id:            uuid("id").primaryKey().defaultRandom(),
  beneficiaryId: uuid("beneficiary_id").notNull(),  // пригласивший
  sourceUserId:  uuid("source_user_id").notNull(),  // приглашённый
  paymentId:     uuid("payment_id").notNull().unique(),
  amountKopecks: integer("amount_kopecks").notNull(),
  tariffSlug:    text("tariff_slug").notNull(),
  status:        earningStatusEnum("status").notNull().default("PENDING_HOLD"),
  holdUntil:     timestamp("hold_until").notNull(),
  availableAt:   timestamp("available_at"),
  reversedAt:    timestamp("reversed_at"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  beneficiaryIdx: index("earnings_beneficiary_idx").on(t.beneficiaryId),
  statusIdx:      index("earnings_status_idx").on(t.status),
  holdUntilIdx:   index("earnings_hold_until_idx").on(t.holdUntil),
}));

// ─── Payouts ────────────────────────────────────────────────────

export const payouts = pgTable("payouts", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull(),
  amountKopecks:   integer("amount_kopecks").notNull(),
  phoneSnapshot:   text("phone_snapshot").notNull(), // зашифрованный номер на момент выплаты
  method:          text("method").notNull().default("sbp"),
  status:          payoutStatusEnum("status").notNull().default("REQUESTED"),
  externalPayoutId: text("external_payout_id"),
  provider:        text("provider"),
  requestedAt:     timestamp("requested_at").notNull().defaultNow(),
  processedAt:     timestamp("processed_at"),
  failedAt:        timestamp("failed_at"),
  failureReason:   text("failure_reason"),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx:   index("payouts_user_idx").on(t.userId),
  statusIdx: index("payouts_status_idx").on(t.status),
}));

// ─── Payout Items ───────────────────────────────────────────────

export const payoutItems = pgTable("payout_items", {
  id:        uuid("id").primaryKey().defaultRandom(),
  payoutId:  uuid("payout_id").notNull(),
  earningId: uuid("earning_id").notNull().unique(),
});

// ─── Webhook Events ─────────────────────────────────────────────

export const webhookEvents = pgTable("webhook_events", {
  id:              uuid("id").primaryKey().defaultRandom(),
  provider:        text("provider").notNull(),
  externalEventId: text("external_event_id").notNull(),
  eventType:       text("event_type").notNull(),
  payload:         json("payload").notNull(),
  status:          webhookStatusEnum("status").notNull().default("PENDING"),
  error:           text("error"),
  receivedAt:      timestamp("received_at").notNull().defaultNow(),
  processedAt:     timestamp("processed_at"),
}, (t) => ({
  uniqueEvent: uniqueIndex("webhook_events_provider_external_idx")
    .on(t.provider, t.externalEventId),
  statusIdx: index("webhook_events_status_idx").on(t.status),
}));

// ─── Content ────────────────────────────────────────────────────

export const contentItems = pgTable("content_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  title:       text("title").notNull(),
  description: text("description"),
  type:        contentTypeEnum("type").notNull(),
  fileKey:     text("file_key"),
  fileSize:    integer("file_size"),
  mimeType:    text("mime_type"),
  url:         text("url"),
  isPublished: boolean("is_published").notNull().default(false),
  tariffAccess: text("tariff_access").array().notNull().default([]),
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});
