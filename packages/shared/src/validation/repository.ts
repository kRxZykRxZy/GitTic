/**
 * Shared validation schemas for repository management
 */

interface RepositorySettings {
  description?: string;
  defaultBranch?: string;
  [key: string]: unknown;
}

export function validateRepositorySettings(settings: RepositorySettings): string[] {
  const errors: string[] = [];

  if (settings.description && settings.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  if (settings.defaultBranch && !/^[a-zA-Z0-9_\-\/\.]+$/.test(settings.defaultBranch)) {
    errors.push('Default branch name contains invalid characters');
  }

  return errors;
}

export function validateWebhookUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Webhook URL must use HTTP or HTTPS';
    }
    return null;
  } catch {
    return 'Invalid webhook URL';
  }
}

export function validateSSHPublicKey(key: string): string | null {
  if (!key || key.trim().length === 0) {
    return 'SSH public key is required';
  }

  const sshKeyPattern = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256)\s+[A-Za-z0-9+\/=]+/;
  
  if (!sshKeyPattern.test(key.trim())) {
    return 'Invalid SSH public key format';
  }

  return null;
}
