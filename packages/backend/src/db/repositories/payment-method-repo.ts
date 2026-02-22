import { randomUUID } from "node:crypto";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { getDb } from "../connection.js";

/**
 * Payment Methods Repository
 * 
 * Securely stores payment method information with encryption.
 * IMPORTANT: This is a simplified implementation. For production:
 * - Use a proper payment processor (Stripe, PayPal) 
 * - Never store full card numbers or CVV
 * - Comply with PCI DSS standards
 * - Use tokenization services
 */

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || "default-key-change-in-production-32b";
const ALGORITHM = "aes-256-gcm";

interface PaymentMethodRow {
  id: string;
  user_id: string;
  type: string;
  card_hash: string; // Encrypted card token
  last4: string; // Last 4 digits (plain)
  brand: string; // Visa, Mastercard, etc.
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string; // Encrypted
  billing_address: string | null; // Encrypted JSON
  is_default: number; // SQLite boolean
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: "card" | "paypal" | "bank";
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreatePaymentMethodInput {
  userId: string;
  type: "card";
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string; // Never stored, only used for validation
  cardholderName: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const key = scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(":");
  
  const key = scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Validate card number using Luhn algorithm
 */
function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Detect card brand from card number
 */
function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  if (/^35/.test(digits)) return "JCB";
  
  return "Unknown";
}

/**
 * Create a payment method
 */
export function createPaymentMethod(input: CreatePaymentMethodInput): PaymentMethod {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  
  // Validate card number
  if (!validateCardNumber(input.cardNumber)) {
    throw new Error("Invalid card number");
  }
  
  // Validate expiry
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  if (input.expiryYear < currentYear || 
      (input.expiryYear === currentYear && input.expiryMonth < currentMonth)) {
    throw new Error("Card has expired");
  }
  
  // Validate CVV (basic)
  if (!/^\d{3,4}$/.test(input.cvv)) {
    throw new Error("Invalid CVV");
  }
  
  // Extract last 4 digits
  const cleanCardNumber = input.cardNumber.replace(/\D/g, "");
  const last4 = cleanCardNumber.slice(-4);
  
  // Detect brand
  const brand = detectCardBrand(cleanCardNumber);
  
  // Create a token hash (never store full card number!)
  // In production, use a payment processor's tokenization
  const cardToken = `tok_${randomUUID()}`;
  const cardHash = encrypt(cardToken);
  
  // Encrypt cardholder name
  const encryptedName = encrypt(input.cardholderName);
  
  // Encrypt billing address if provided
  const encryptedAddress = input.billingAddress 
    ? encrypt(JSON.stringify(input.billingAddress))
    : null;
  
  // Check if this is the first payment method for user
  const existingCount = db.prepare(
    "SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?"
  ).get(input.userId) as { count: number };
  
  const isDefault = existingCount.count === 0;
  
  // If setting as default, unset others
  if (isDefault) {
    db.prepare(
      "UPDATE payment_methods SET is_default = 0 WHERE user_id = ?"
    ).run(input.userId);
  }
  
  db.prepare(
    `INSERT INTO payment_methods (
      id, user_id, type, card_hash, last4, brand,
      expiry_month, expiry_year, cardholder_name,
      billing_address, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    input.type,
    cardHash,
    last4,
    brand,
    input.expiryMonth,
    input.expiryYear,
    encryptedName,
    encryptedAddress,
    isDefault ? 1 : 0,
    now,
    now
  );
  
  return {
    id,
    userId: input.userId,
    type: input.type,
    last4,
    brand,
    expiryMonth: input.expiryMonth,
    expiryYear: input.expiryYear,
    isDefault,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * List user's payment methods
 */
export function listPaymentMethods(userId: string): PaymentMethod[] {
  const db = getDb();
  
  const rows = db.prepare(
    `SELECT id, user_id, type, last4, brand, expiry_month, expiry_year,
     is_default, created_at, updated_at
     FROM payment_methods
     WHERE user_id = ?
     ORDER BY is_default DESC, created_at DESC`
  ).all(userId) as PaymentMethodRow[];
  
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as "card",
    last4: row.last4,
    brand: row.brand,
    expiryMonth: row.expiry_month,
    expiryYear: row.expiry_year,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get a payment method by ID
 */
export function getPaymentMethod(id: string, userId: string): PaymentMethod | null {
  const db = getDb();
  
  const row = db.prepare(
    `SELECT id, user_id, type, last4, brand, expiry_month, expiry_year,
     is_default, created_at, updated_at
     FROM payment_methods
     WHERE id = ? AND user_id = ?`
  ).get(id, userId) as PaymentMethodRow | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as "card",
    last4: row.last4,
    brand: row.brand,
    expiryMonth: row.expiry_month,
    expiryYear: row.expiry_year,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Set a payment method as default
 */
export function setDefaultPaymentMethod(id: string, userId: string): void {
  const db = getDb();
  
  // Unset current default
  db.prepare(
    "UPDATE payment_methods SET is_default = 0 WHERE user_id = ?"
  ).run(userId);
  
  // Set new default
  db.prepare(
    "UPDATE payment_methods SET is_default = 1, updated_at = ? WHERE id = ? AND user_id = ?"
  ).run(new Date().toISOString(), id, userId);
}

/**
 * Delete a payment method
 */
export function deletePaymentMethod(id: string, userId: string): void {
  const db = getDb();
  
  const method = getPaymentMethod(id, userId);
  if (!method) {
    throw new Error("Payment method not found");
  }
  
  db.prepare(
    "DELETE FROM payment_methods WHERE id = ? AND user_id = ?"
  ).run(id, userId);
  
  // If it was default, set another as default
  if (method.isDefault) {
    const remaining = listPaymentMethods(userId);
    if (remaining.length > 0) {
      setDefaultPaymentMethod(remaining[0].id, userId);
    }
  }
}
