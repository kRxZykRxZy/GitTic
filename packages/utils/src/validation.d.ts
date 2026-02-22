/**
 * Validate email address format.
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate username: 3-39 chars, alphanumeric and hyphens, cannot start/end with hyphen.
 */
export declare function isValidUsername(username: string): boolean;
/**
 * Validate project/repo name: 1-100 chars, alphanumeric, hyphens, underscores, dots.
 */
export declare function isValidRepoName(name: string): boolean;
/**
 * Validate branch name (simplified Git rules).
 */
export declare function isValidBranchName(name: string): boolean;
/**
 * Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit.
 */
export declare function isStrongPassword(password: string): boolean;
//# sourceMappingURL=validation.d.ts.map