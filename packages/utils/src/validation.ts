/**
 * Validate email address format.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate username: 3-39 chars, alphanumeric and hyphens, cannot start/end with hyphen.
 */
export function isValidUsername(username: string): boolean {
  const re = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,37}[a-zA-Z0-9])?$/;
  return re.test(username);
}

/**
 * Validate project/repo name: 1-100 chars, alphanumeric, hyphens, underscores, dots.
 */
export function isValidRepoName(name: string): boolean {
  const re = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
  return re.test(name) && !name.endsWith(".git") && name !== "." && name !== "..";
}

/**
 * Validate branch name (simplified Git rules).
 */
export function isValidBranchName(name: string): boolean {
  if (name.length === 0 || name.length > 255) return false;
  if (name.startsWith("-") || name.startsWith(".")) return false;
  if (name.endsWith(".lock") || name.endsWith(".")) return false;
  if (name.includes("..") || name.includes("~") || name.includes("^") || name.includes(":")) return false;
  if (name.includes("\\") || name.includes(" ") || name.includes("?") || name.includes("*") || name.includes("[")) return false;
  return true;
}

/**
 * Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit.
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}
