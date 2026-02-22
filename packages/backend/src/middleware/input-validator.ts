import type { Request, Response, NextFunction } from "express";
import { sanitizeHtml } from "@platform/utils";

/**
 * A validation rule descriptor.
 * Each rule specifies a field name, the location where it appears,
 * and one or more constraints to enforce.
 */
export interface ValidationRule {
  /** Name of the field to validate. */
  field: string;
  /** Where the value lives on the request object. */
  location: "body" | "query" | "params";
  /** Whether the field must be present. Defaults to false. */
  required?: boolean;
  /** Expected primitive type (checked via `typeof`). */
  type?: "string" | "number" | "boolean" | "object";
  /** Minimum length for strings / minimum value for numbers. */
  min?: number;
  /** Maximum length for strings / maximum value for numbers. */
  max?: number;
  /** Regular expression the value must match (strings only). */
  pattern?: RegExp;
  /** Custom error message when the rule fails. */
  message?: string;
  /** Whether to sanitise the value via sanitizeHtml. Defaults to true for strings. */
  sanitize?: boolean;
}

/**
 * Characters considered dangerous and stripped from user input
 * unless they are explicitly allowed by the schema.
 */
const DANGEROUS_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Strip NUL bytes and other non-printable control characters that
 * have no legitimate place in user-supplied text.
 */
function stripDangerousChars(value: string): string {
  return value.replace(DANGEROUS_CHARS, "");
}

/**
 * Deeply sanitise a value: strings are scrubbed for XSS and
 * dangerous characters; objects/arrays are traversed recursively.
 */
function deepSanitize(value: unknown): unknown {
  if (typeof value === "string") {
    const cleaned = stripDangerousChars(value);
    return sanitizeHtml(cleaned);
  }
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = deepSanitize(v);
    }
    return result;
  }
  return value;
}

/**
 * Validate a single field against its rule and return an error
 * message (or `null` if valid).
 */
function validateField(
  value: unknown,
  rule: ValidationRule,
): string | null {
  // Required check
  if (rule.required && (value === undefined || value === null || value === "")) {
    return rule.message ?? `${rule.field} is required`;
  }

  // Nothing more to check if value is absent and not required
  if (value === undefined || value === null) return null;

  // Type check
  if (rule.type && typeof value !== rule.type) {
    return rule.message ?? `${rule.field} must be of type ${rule.type}`;
  }

  // String-specific constraints
  if (typeof value === "string") {
    if (rule.min !== undefined && value.length < rule.min) {
      return rule.message ?? `${rule.field} must be at least ${rule.min} characters`;
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return rule.message ?? `${rule.field} must be at most ${rule.max} characters`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message ?? `${rule.field} has an invalid format`;
    }
  }

  // Number-specific constraints
  if (typeof value === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return rule.message ?? `${rule.field} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return rule.message ?? `${rule.field} must be at most ${rule.max}`;
    }
  }

  return null;
}

/**
 * Middleware factory that validates and sanitises request input.
 *
 * Accepts an array of {@link ValidationRule} descriptors. For each
 * rule the corresponding field is extracted from `req.body`,
 * `req.query`, or `req.params`, validated, and (for strings)
 * sanitised to remove XSS vectors and control characters.
 *
 * If any rule fails the request is rejected with a `400` response
 * containing all validation errors.
 *
 * @param rules - Array of validation rules to enforce.
 * @returns Express middleware function.
 *
 * @example
 * router.post(
 *   "/register",
 *   validate([
 *     { field: "username", location: "body", required: true, type: "string", min: 3, max: 39 },
 *     { field: "email",    location: "body", required: true, type: "string", pattern: /^.+@.+$/ },
 *   ]),
 *   registerHandler,
 * );
 */
export function validate(
  rules: ValidationRule[],
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const source =
        rule.location === "body"
          ? req.body
          : rule.location === "query"
            ? req.query
            : req.params;

      let value: unknown = (source as Record<string, unknown>)?.[rule.field];

      // Sanitise string values by default
      if (typeof value === "string" && rule.sanitize !== false) {
        value = deepSanitize(value) as string;
        (source as Record<string, unknown>)[rule.field] = value;
      }

      const errorMsg = validateField(value, rule);
      if (errorMsg) {
        errors.push({ field: rule.field, message: errorMsg });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors,
      });
      return;
    }

    next();
  };
}

/**
 * Convenience middleware that sanitises the entire request body
 * (recursively) without applying any specific validation rules.
 *
 * Mount early in the middleware stack to ensure all downstream
 * handlers receive clean input.
 *
 * @example
 * app.use(sanitizeBody);
 */
export function sanitizeBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }
  next();
}
