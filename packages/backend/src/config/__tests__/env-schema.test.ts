import { describe, it, expect } from "vitest";
import { ENV_SCHEMA, getEnvDefault, validateEnv } from "../env-schema.js";

describe("env-schema", () => {
  it("contains key defaults used by backend config", () => {
    expect(ENV_SCHEMA.length).toBeGreaterThan(0);
    expect(getEnvDefault("PORT")).toBe("3000");
    expect(getEnvDefault("DATA_DIR")).toBe("./data");
    expect(getEnvDefault("CLUSTER_MAX_JOBS_PER_NODE")).toBe("4");
  });

  it("validates number and boolean settings", () => {
    const errors = validateEnv({
      PORT: "not-a-number",
      REDIS_ENABLED: "sometimes",
    });

    expect(errors).toContain('PORT must be a valid number, got "not-a-number"');
    expect(errors).toContain('REDIS_ENABLED must be "true" or "false", got "sometimes"');
  });

  it("returns no errors for values matching the schema", () => {
    const errors = validateEnv({
      PORT: "4000",
      REDIS_ENABLED: "false",
      SMTP_PORT: "2525",
      AI_ENABLED: "true",
    });

    expect(errors).toEqual([]);
  });
});
