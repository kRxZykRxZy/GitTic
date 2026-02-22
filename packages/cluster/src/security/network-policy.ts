/**
 * Network policy enforcement for cluster security.
 * Manages IP allowlists, port restrictions, and TLS enforcement
 * for inter-node communication.
 * @module
 */

import { EventEmitter } from "node:events";

/** IP allowlist entry */
export interface IpAllowlistEntry {
  /** CIDR notation or exact IP address */
  address: string;
  /** Description of the entry */
  description: string;
  /** When the entry was added */
  addedAt: number;
  /** Who added the entry */
  addedBy: string;
  /** Whether this entry is active */
  active: boolean;
}

/** Port restriction rule */
export interface PortRule {
  /** Rule identifier */
  id: string;
  /** Port number */
  port: number;
  /** Protocol */
  protocol: "tcp" | "udp" | "both";
  /** Whether the port is allowed */
  allowed: boolean;
  /** Description */
  description: string;
}

/** TLS enforcement configuration */
export interface TlsPolicy {
  /** Whether TLS is required for all communication */
  required: boolean;
  /** Minimum TLS version (e.g., "1.2", "1.3") */
  minimumVersion: string;
  /** Whether to verify certificates */
  verifyCertificates: boolean;
  /** Whether to require mutual TLS */
  mutualTls: boolean;
}

/** Network policy check result */
export interface PolicyCheckResult {
  /** Whether the connection is allowed */
  allowed: boolean;
  /** Policy that made the decision */
  policyType: "ip-allowlist" | "port-restriction" | "tls-enforcement";
  /** Reason for the decision */
  reason: string;
  /** Timestamp of the check */
  checkedAt: number;
}

/** Connection details for policy evaluation */
export interface ConnectionInfo {
  /** Source IP address */
  sourceIp: string;
  /** Destination port */
  destinationPort: number;
  /** Protocol */
  protocol: "tcp" | "udp";
  /** Whether TLS is being used */
  tlsEnabled: boolean;
  /** TLS version if applicable */
  tlsVersion: string | null;
  /** Whether the certificate was verified */
  certificateVerified: boolean;
}

/**
 * Enforces network policies for cluster communication.
 * Checks IP allowlists, port restrictions, and TLS requirements.
 */
export class NetworkPolicyManager extends EventEmitter {
  private readonly ipAllowlist = new Map<string, IpAllowlistEntry>();
  private readonly portRules = new Map<string, PortRule>();
  private tlsPolicy: TlsPolicy;
  private readonly auditLog: PolicyCheckResult[] = [];
  private readonly maxAuditLog: number;
  private enforceIpAllowlist: boolean;

  /**
   * @param enforceIpAllowlist - Whether to enforce IP allowlisting (default: false)
   * @param maxAuditLog - Maximum audit log entries (default: 10000)
   */
  constructor(enforceIpAllowlist: boolean = false, maxAuditLog: number = 10_000) {
    super();
    this.enforceIpAllowlist = enforceIpAllowlist;
    this.maxAuditLog = maxAuditLog;
    this.tlsPolicy = {
      required: false,
      minimumVersion: "1.2",
      verifyCertificates: true,
      mutualTls: false,
    };
  }

  /**
   * Add an IP to the allowlist.
   * @param address - IP address or CIDR notation
   * @param description - Description
   * @param addedBy - Who added the entry
   */
  addIpAllowlist(address: string, description: string, addedBy: string): void {
    this.ipAllowlist.set(address, {
      address,
      description,
      addedAt: Date.now(),
      addedBy,
      active: true,
    });
    this.emit("policy:ip-added", address);
  }

  /**
   * Remove an IP from the allowlist.
   * @param address - IP address to remove
   */
  removeIpAllowlist(address: string): boolean {
    const removed = this.ipAllowlist.delete(address);
    if (removed) {
      this.emit("policy:ip-removed", address);
    }
    return removed;
  }

  /**
   * Add a port restriction rule.
   * @param rule - Port rule definition
   */
  addPortRule(rule: PortRule): void {
    this.portRules.set(rule.id, rule);
    this.emit("policy:port-rule-added", rule);
  }

  /**
   * Remove a port restriction rule.
   * @param ruleId - Rule identifier
   */
  removePortRule(ruleId: string): boolean {
    return this.portRules.delete(ruleId);
  }

  /**
   * Set the TLS enforcement policy.
   * @param policy - TLS policy configuration
   */
  setTlsPolicy(policy: Partial<TlsPolicy>): void {
    this.tlsPolicy = { ...this.tlsPolicy, ...policy };
    this.emit("policy:tls-updated", this.tlsPolicy);
  }

  /**
   * Evaluate all network policies for a connection.
   * Returns the first failing check or an allow result.
   * @param connection - Connection details
   * @returns Policy check result
   */
  evaluate(connection: ConnectionInfo): PolicyCheckResult {
    // Check IP allowlist
    if (this.enforceIpAllowlist) {
      const ipResult = this.checkIpAllowlist(connection.sourceIp);
      if (!ipResult.allowed) {
        this.recordAudit(ipResult);
        return ipResult;
      }
    }

    // Check port restrictions
    const portResult = this.checkPort(connection.destinationPort, connection.protocol);
    if (!portResult.allowed) {
      this.recordAudit(portResult);
      return portResult;
    }

    // Check TLS requirements
    const tlsResult = this.checkTls(connection);
    if (!tlsResult.allowed) {
      this.recordAudit(tlsResult);
      return tlsResult;
    }

    const result: PolicyCheckResult = {
      allowed: true,
      policyType: "ip-allowlist",
      reason: "All policies passed",
      checkedAt: Date.now(),
    };

    this.recordAudit(result);
    return result;
  }

  /**
   * Check if an IP is in the allowlist.
   */
  private checkIpAllowlist(sourceIp: string): PolicyCheckResult {
    // Check exact match
    const entry = this.ipAllowlist.get(sourceIp);
    if (entry?.active) {
      return {
        allowed: true,
        policyType: "ip-allowlist",
        reason: `IP ${sourceIp} is allowlisted`,
        checkedAt: Date.now(),
      };
    }

    // Check CIDR matches
    for (const [, allowEntry] of this.ipAllowlist) {
      if (allowEntry.active && this.ipMatchesCidr(sourceIp, allowEntry.address)) {
        return {
          allowed: true,
          policyType: "ip-allowlist",
          reason: `IP ${sourceIp} matches CIDR ${allowEntry.address}`,
          checkedAt: Date.now(),
        };
      }
    }

    return {
      allowed: false,
      policyType: "ip-allowlist",
      reason: `IP ${sourceIp} not in allowlist`,
      checkedAt: Date.now(),
    };
  }

  /**
   * Check port against restriction rules.
   */
  private checkPort(port: number, protocol: "tcp" | "udp"): PolicyCheckResult {
    for (const rule of this.portRules.values()) {
      if (rule.port === port && (rule.protocol === "both" || rule.protocol === protocol)) {
        return {
          allowed: rule.allowed,
          policyType: "port-restriction",
          reason: rule.allowed
            ? `Port ${port}/${protocol} is allowed`
            : `Port ${port}/${protocol} is restricted: ${rule.description}`,
          checkedAt: Date.now(),
        };
      }
    }

    return {
      allowed: true,
      policyType: "port-restriction",
      reason: `Port ${port}/${protocol} has no restrictions`,
      checkedAt: Date.now(),
    };
  }

  /**
   * Check TLS enforcement requirements.
   */
  private checkTls(connection: ConnectionInfo): PolicyCheckResult {
    if (this.tlsPolicy.required && !connection.tlsEnabled) {
      return {
        allowed: false,
        policyType: "tls-enforcement",
        reason: "TLS is required but not enabled",
        checkedAt: Date.now(),
      };
    }

    if (
      connection.tlsEnabled &&
      connection.tlsVersion &&
      this.compareTlsVersions(connection.tlsVersion, this.tlsPolicy.minimumVersion) < 0
    ) {
      return {
        allowed: false,
        policyType: "tls-enforcement",
        reason: `TLS version ${connection.tlsVersion} below minimum ${this.tlsPolicy.minimumVersion}`,
        checkedAt: Date.now(),
      };
    }

    if (
      this.tlsPolicy.verifyCertificates &&
      connection.tlsEnabled &&
      !connection.certificateVerified
    ) {
      return {
        allowed: false,
        policyType: "tls-enforcement",
        reason: "Certificate verification failed",
        checkedAt: Date.now(),
      };
    }

    return {
      allowed: true,
      policyType: "tls-enforcement",
      reason: "TLS requirements met",
      checkedAt: Date.now(),
    };
  }

  /**
   * Simple CIDR matching for IPv4.
   */
  private ipMatchesCidr(ip: string, cidr: string): boolean {
    if (!cidr.includes("/")) return ip === cidr;

    const [network, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    const ipNum = this.ipToNumber(ip);
    const networkNum = this.ipToNumber(network);
    if (ipNum === null || networkNum === null) return false;

    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipNum & mask) === (networkNum & mask);
  }

  /**
   * Convert IPv4 address string to a 32-bit number.
   */
  private ipToNumber(ip: string): number | null {
    const parts = ip.split(".");
    if (parts.length !== 4) return null;

    let result = 0;
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) return null;
      result = (result << 8) | num;
    }

    return result >>> 0;
  }

  /**
   * Compare two TLS version strings.
   * @returns Negative if a < b, 0 if equal, positive if a > b
   */
  private compareTlsVersions(a: string, b: string): number {
    const parseVersion = (v: string): number => parseFloat(v) || 0;
    return parseVersion(a) - parseVersion(b);
  }

  /**
   * Record a policy check in the audit log.
   */
  private recordAudit(result: PolicyCheckResult): void {
    this.auditLog.push(result);
    if (this.auditLog.length > this.maxAuditLog) {
      this.auditLog.splice(0, this.auditLog.length - this.maxAuditLog);
    }
  }

  /**
   * Get recent audit log entries.
   * @param limit - Maximum entries to return
   */
  getAuditLog(limit?: number): PolicyCheckResult[] {
    if (limit && limit < this.auditLog.length) {
      return this.auditLog.slice(-limit);
    }
    return [...this.auditLog];
  }

  /**
   * Get all IP allowlist entries.
   */
  getIpAllowlist(): IpAllowlistEntry[] {
    return Array.from(this.ipAllowlist.values());
  }

  /**
   * Get all port rules.
   */
  getPortRules(): PortRule[] {
    return Array.from(this.portRules.values());
  }

  /**
   * Get the current TLS policy.
   */
  getTlsPolicy(): TlsPolicy {
    return { ...this.tlsPolicy };
  }

  /**
   * Enable or disable IP allowlist enforcement.
   */
  setEnforceIpAllowlist(enforce: boolean): void {
    this.enforceIpAllowlist = enforce;
  }
}
