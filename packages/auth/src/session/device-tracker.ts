/**
 * Device fingerprinting and tracking for session security.
 * Parses user-agent strings, records known devices, and
 * detects suspicious login attempts from new/unknown devices.
 * @module session/device-tracker
 */

import { createHash } from "node:crypto";

/**
 * Parsed device information extracted from a user-agent string.
 */
export interface DeviceInfo {
  /** Browser name (e.g., "Chrome", "Firefox") */
  browser: string;
  /** Browser version */
  browserVersion: string;
  /** Operating system (e.g., "Windows", "macOS") */
  os: string;
  /** OS version */
  osVersion: string;
  /** Device type (e.g., "desktop", "mobile", "tablet") */
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  /** Whether the user agent appears to be a bot */
  isBot: boolean;
  /** Raw user-agent string */
  rawUserAgent: string;
}

/**
 * A known/registered device for a user.
 */
export interface KnownDevice {
  /** Unique device ID (hash of device characteristics) */
  deviceId: string;
  /** User ID this device belongs to */
  userId: string;
  /** Parsed device information */
  deviceInfo: DeviceInfo;
  /** First seen timestamp */
  firstSeenAt: number;
  /** Last seen timestamp */
  lastSeenAt: number;
  /** Number of logins from this device */
  loginCount: number;
  /** Whether the device is trusted by the user */
  trusted: boolean;
  /** IP addresses used with this device */
  ipAddresses: string[];
}

/**
 * Login attempt assessment result.
 */
export interface LoginAssessment {
  /** Whether this is a known device */
  knownDevice: boolean;
  /** Whether this is a trusted device */
  trustedDevice: boolean;
  /** Risk level of the login */
  riskLevel: "low" | "medium" | "high";
  /** Reasons for the risk assessment */
  reasons: string[];
  /** The device ID */
  deviceId: string;
}

/**
 * Parse a user-agent string into structured device information.
 * Uses pattern matching against common browser/OS identifiers.
 * @param userAgent - Raw user-agent string
 * @returns Parsed device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect bots
  const isBot = /bot|crawler|spider|scraper|curl|wget|postman/i.test(
    userAgent
  );

  // Detect browser
  let browser = "Unknown";
  let browserVersion = "";

  if (/edg\//i.test(userAgent)) {
    browser = "Edge";
    browserVersion = extractVersion(userAgent, /edg\/(\d+[\d.]*)/i);
  } else if (/chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)) {
    browser = "Chrome";
    browserVersion = extractVersion(userAgent, /chrome\/(\d+[\d.]*)/i);
  } else if (/firefox\//i.test(userAgent)) {
    browser = "Firefox";
    browserVersion = extractVersion(userAgent, /firefox\/(\d+[\d.]*)/i);
  } else if (/safari\//i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
    browserVersion = extractVersion(userAgent, /version\/(\d+[\d.]*)/i);
  } else if (/opera|opr\//i.test(userAgent)) {
    browser = "Opera";
    browserVersion = extractVersion(userAgent, /(?:opera|opr)\/(\d+[\d.]*)/i);
  }

  // Detect OS
  let os = "Unknown";
  let osVersion = "";

  if (/windows nt/i.test(userAgent)) {
    os = "Windows";
    osVersion = extractVersion(userAgent, /windows nt (\d+[\d.]*)/i);
  } else if (/mac os x/i.test(userAgent)) {
    os = "macOS";
    osVersion = extractVersion(
      userAgent,
      /mac os x (\d+[._\d]*)/i
    ).replace(/_/g, ".");
  } else if (/linux/i.test(userAgent)) {
    os = "Linux";
    osVersion = "";
  } else if (/android/i.test(userAgent)) {
    os = "Android";
    osVersion = extractVersion(userAgent, /android (\d+[\d.]*)/i);
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = "iOS";
    osVersion = extractVersion(
      userAgent,
      /os (\d+[._\d]*)/i
    ).replace(/_/g, ".");
  }

  // Detect device type
  let deviceType: DeviceInfo["deviceType"] = "desktop";
  if (isBot) {
    deviceType = "bot";
  } else if (/mobile|android|iphone/i.test(ua)) {
    deviceType = "mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = "tablet";
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    isBot,
    rawUserAgent: userAgent,
  };
}

/**
 * Extract a version string from a user-agent using a regex pattern.
 * @param userAgent - Raw user-agent string
 * @param pattern - Regex with a capture group for the version
 * @returns Extracted version string or empty string
 */
function extractVersion(userAgent: string, pattern: RegExp): string {
  const match = userAgent.match(pattern);
  return match ? match[1] : "";
}

/**
 * Generate a stable device ID from device characteristics.
 * @param deviceInfo - Parsed device info
 * @returns SHA-256 hash-based device ID
 */
export function generateDeviceId(deviceInfo: DeviceInfo): string {
  const fingerprint = [
    deviceInfo.browser,
    deviceInfo.browserVersion.split(".")[0],
    deviceInfo.os,
    deviceInfo.deviceType,
  ].join("|");

  return createHash("sha256").update(fingerprint).digest("hex").substring(0, 32);
}

/**
 * Device tracker that manages known devices for users.
 */
export class DeviceTracker {
  private readonly devices = new Map<string, KnownDevice[]>();
  private readonly maxDevicesPerUser: number;

  /**
   * Create a new device tracker.
   * @param maxDevicesPerUser - Maximum devices to track per user (default: 20)
   */
  constructor(maxDevicesPerUser: number = 20) {
    this.maxDevicesPerUser = maxDevicesPerUser;
  }

  /**
   * Record a device login for a user.
   * @param userId - User ID
   * @param userAgent - User-agent string
   * @param ipAddress - Client IP address
   * @returns The device record
   */
  recordLogin(
    userId: string,
    userAgent: string,
    ipAddress: string
  ): KnownDevice {
    const deviceInfo = parseUserAgent(userAgent);
    const deviceId = generateDeviceId(deviceInfo);

    let userDevices = this.devices.get(userId);
    if (!userDevices) {
      userDevices = [];
      this.devices.set(userId, userDevices);
    }

    const existing = userDevices.find((d) => d.deviceId === deviceId);
    const now = Date.now();

    if (existing) {
      existing.lastSeenAt = now;
      existing.loginCount++;
      if (!existing.ipAddresses.includes(ipAddress)) {
        existing.ipAddresses.push(ipAddress);
      }
      existing.deviceInfo = deviceInfo;
      return existing;
    }

    // New device
    const device: KnownDevice = {
      deviceId,
      userId,
      deviceInfo,
      firstSeenAt: now,
      lastSeenAt: now,
      loginCount: 1,
      trusted: false,
      ipAddresses: [ipAddress],
    };

    // Enforce max devices
    if (userDevices.length >= this.maxDevicesPerUser) {
      userDevices.sort((a, b) => a.lastSeenAt - b.lastSeenAt);
      userDevices.shift();
    }

    userDevices.push(device);
    return device;
  }

  /**
   * Assess a login attempt for risk.
   * @param userId - User ID
   * @param userAgent - User-agent string
   * @param ipAddress - Client IP address
   * @returns Login assessment with risk level
   */
  assessLogin(
    userId: string,
    userAgent: string,
    ipAddress: string
  ): LoginAssessment {
    const deviceInfo = parseUserAgent(userAgent);
    const deviceId = generateDeviceId(deviceInfo);
    const userDevices = this.devices.get(userId) ?? [];
    const device = userDevices.find((d) => d.deviceId === deviceId);

    const reasons: string[] = [];
    let riskLevel: LoginAssessment["riskLevel"] = "low";

    if (!device) {
      reasons.push("New device detected");
      riskLevel = "medium";
    }

    if (device && !device.ipAddresses.includes(ipAddress)) {
      reasons.push("New IP address for known device");
      if (riskLevel === "low") riskLevel = "medium";
    }

    if (deviceInfo.isBot) {
      reasons.push("Bot user-agent detected");
      riskLevel = "high";
    }

    if (deviceInfo.browser === "Unknown" && deviceInfo.os === "Unknown") {
      reasons.push("Unrecognized user agent");
      if (riskLevel === "low") riskLevel = "medium";
    }

    return {
      knownDevice: !!device,
      trustedDevice: device?.trusted ?? false,
      riskLevel,
      reasons,
      deviceId,
    };
  }

  /**
   * Trust a device for a user (skip additional verification in future).
   * @param userId - User ID
   * @param deviceId - Device ID to trust
   * @returns True if the device was found and trusted
   */
  trustDevice(userId: string, deviceId: string): boolean {
    const userDevices = this.devices.get(userId) ?? [];
    const device = userDevices.find((d) => d.deviceId === deviceId);
    if (device) {
      device.trusted = true;
      return true;
    }
    return false;
  }

  /**
   * Revoke trust for a device.
   * @param userId - User ID
   * @param deviceId - Device ID to untrust
   * @returns True if the device was found and untrusted
   */
  untrustDevice(userId: string, deviceId: string): boolean {
    const userDevices = this.devices.get(userId) ?? [];
    const device = userDevices.find((d) => d.deviceId === deviceId);
    if (device) {
      device.trusted = false;
      return true;
    }
    return false;
  }

  /**
   * List all known devices for a user.
   * @param userId - User ID
   * @returns Array of known devices
   */
  listDevices(userId: string): KnownDevice[] {
    return [...(this.devices.get(userId) ?? [])];
  }

  /**
   * Remove a device from tracking.
   * @param userId - User ID
   * @param deviceId - Device ID to remove
   * @returns True if the device was removed
   */
  removeDevice(userId: string, deviceId: string): boolean {
    const userDevices = this.devices.get(userId);
    if (!userDevices) return false;
    const index = userDevices.findIndex((d) => d.deviceId === deviceId);
    if (index >= 0) {
      userDevices.splice(index, 1);
      return true;
    }
    return false;
  }
}
