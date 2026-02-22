/**
 * Billing, invoicing, and payment types.
 * @module models/billing
 */

/**
 * Status of an invoice.
 */
export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible" | "overdue";

/**
 * Supported payment methods.
 */
export type PaymentMethodType = "credit_card" | "debit_card" | "bank_transfer" | "paypal";

/**
 * Currency codes supported by the platform (ISO 4217).
 */
export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";

/**
 * An invoice issued to an organization.
 */
export interface Invoice {
  /** Unique identifier for the invoice. */
  id: string;
  /** ID of the organization billed. */
  organizationId: string;
  /** ID of the associated subscription. */
  subscriptionId: string;
  /** Sequential invoice number for display. */
  invoiceNumber: string;
  /** Current status of the invoice. */
  status: InvoiceStatus;
  /** Currency of the invoice. */
  currency: CurrencyCode;
  /** Subtotal in the smallest currency unit (e.g., cents). */
  subtotalCents: number;
  /** Tax amount in the smallest currency unit. */
  taxCents: number;
  /** Total amount in the smallest currency unit. */
  totalCents: number;
  /** Line items on the invoice. */
  lineItems: InvoiceLineItem[];
  /** ISO-8601 date the invoice was issued. */
  issuedAt: string;
  /** ISO-8601 due date. */
  dueAt: string;
  /** ISO-8601 date the invoice was paid. */
  paidAt?: string;
  /** URL to download the invoice PDF. */
  pdfUrl?: string;
}

/**
 * A single line item on an invoice.
 */
export interface InvoiceLineItem {
  /** Description of the line item. */
  description: string;
  /** Quantity. */
  quantity: number;
  /** Unit price in the smallest currency unit. */
  unitPriceCents: number;
  /** Total amount in the smallest currency unit. */
  totalCents: number;
  /** ISO-8601 start of the billing period. */
  periodStart: string;
  /** ISO-8601 end of the billing period. */
  periodEnd: string;
}

/**
 * A payment method on file for an organization.
 */
export interface PaymentMethod {
  /** Unique identifier for the payment method. */
  id: string;
  /** ID of the organization that owns this payment method. */
  organizationId: string;
  /** Type of payment method. */
  type: PaymentMethodType;
  /** Whether this is the default payment method. */
  isDefault: boolean;
  /** Last four digits (for card types). */
  lastFour?: string;
  /** Card brand (e.g., "visa", "mastercard"). */
  brand?: string;
  /** Card expiration month (1-12). */
  expiryMonth?: number;
  /** Card expiration year. */
  expiryYear?: number;
  /** Billing address. */
  billingAddress?: BillingAddress;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

/**
 * Billing address associated with a payment method.
 */
export interface BillingAddress {
  /** Address line 1. */
  line1: string;
  /** Address line 2. */
  line2?: string;
  /** City. */
  city: string;
  /** State or province. */
  state?: string;
  /** Postal / ZIP code. */
  postalCode: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
}

/**
 * Summary of current billing usage for an organization.
 */
export interface BillingUsageSummary {
  /** ID of the organization. */
  organizationId: string;
  /** Current billing period start (ISO-8601). */
  periodStart: string;
  /** Current billing period end (ISO-8601). */
  periodEnd: string;
  /** Build minutes used in the current period. */
  buildMinutesUsed: number;
  /** Storage used in megabytes. */
  storageMbUsed: number;
  /** Bandwidth used in megabytes. */
  bandwidthMbUsed: number;
  /** Number of active seats. */
  activeSeats: number;
}
