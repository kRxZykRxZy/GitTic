/** Validation result */
export interface ValidationResult {
  valid: boolean;
  message: string;
}

/** Check that a field is not empty */
export function required(value: string, fieldName = "Field"): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: "" };
}

/** Check minimum length */
export function minLength(
  value: string,
  min: number,
  fieldName = "Field",
): ValidationResult {
  if (value.length < min) {
    return {
      valid: false,
      message: `${fieldName} must be at least ${min} characters`,
    };
  }
  return { valid: true, message: "" };
}

/** Check maximum length */
export function maxLength(
  value: string,
  max: number,
  fieldName = "Field",
): ValidationResult {
  if (value.length > max) {
    return {
      valid: false,
      message: `${fieldName} must be at most ${max} characters`,
    };
  }
  return { valid: true, message: "" };
}

/** Validate email format */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: "Invalid email format" };
  }

  if (trimmed.length > 254) {
    return { valid: false, message: "Email is too long" };
  }

  return { valid: true, message: "" };
}

/**
 * Validate password strength.
 * Requirements: min 8 chars, at least one uppercase, one lowercase, one digit.
 */
export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters",
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      message: "Password must be at most 128 characters",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one digit",
    };
  }

  return { valid: true, message: "" };
}

/**
 * Validate username format.
 * Requirements: 3-39 chars, alphanumeric + hyphens, no leading/trailing hyphen.
 */
export function validateUsername(username: string): ValidationResult {
  const trimmed = username.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: "Username is required" };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      message: "Username must be at least 3 characters",
    };
  }

  if (trimmed.length > 39) {
    return {
      valid: false,
      message: "Username must be at most 39 characters",
    };
  }

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed)) {
    return {
      valid: false,
      message:
        "Username may only contain alphanumeric characters or hyphens, " +
        "and cannot start or end with a hyphen",
    };
  }

  return { valid: true, message: "" };
}

/** Validate that two passwords match */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): ValidationResult {
  if (password !== confirmPassword) {
    return { valid: false, message: "Passwords do not match" };
  }
  return { valid: true, message: "" };
}

/**
 * Run multiple validators and return the first failure, or success.
 */
export function composeValidators(
  ...results: ValidationResult[]
): ValidationResult {
  for (const result of results) {
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true, message: "" };
}
