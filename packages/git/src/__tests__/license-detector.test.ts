import { describe, it, expect } from "vitest";
import {
  identifyLicense,
  getSupportedLicenses,
  isOpenSourceLicense,
} from "../license/license-detector.js";

const MIT_LICENSE = `MIT License

Copyright (c) 2024 Test

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`;

const APACHE_LICENSE = `
                                 Apache License
                           Version 2.0, January 2004

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
`;

const GPL3_LICENSE = `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

either version 3 of the license, or (at your option) any later version.`;

describe("identifyLicense", () => {
  it("detects MIT license", () => {
    const result = identifyLicense(MIT_LICENSE, "LICENSE");
    expect(result.licenseId).toBe("MIT");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("detects Apache-2.0 license", () => {
    const result = identifyLicense(APACHE_LICENSE, "LICENSE");
    expect(result.licenseId).toBe("Apache-2.0");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("detects GPL-3.0 license", () => {
    const result = identifyLicense(GPL3_LICENSE, "LICENSE");
    expect(result.licenseId).toBe("GPL-3.0");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns unknown for unrecognized content", () => {
    const result = identifyLicense("This is just some random text.", "LICENSE");
    expect(result.licenseId).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("includes filePath in result", () => {
    const result = identifyLicense(MIT_LICENSE, "path/to/LICENSE");
    expect(result.filePath).toBe("path/to/LICENSE");
  });

  it("handles empty content", () => {
    const result = identifyLicense("", "LICENSE");
    expect(result.licenseId).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("is case insensitive", () => {
    const upper = MIT_LICENSE.toUpperCase();
    const result = identifyLicense(upper, "LICENSE");
    expect(result.licenseId).toBe("MIT");
  });
});

describe("getSupportedLicenses", () => {
  it("returns array of license IDs", () => {
    const licenses = getSupportedLicenses();
    expect(Array.isArray(licenses)).toBe(true);
    expect(licenses.length).toBeGreaterThan(0);
  });

  it("includes common licenses", () => {
    const licenses = getSupportedLicenses();
    expect(licenses).toContain("MIT");
    expect(licenses).toContain("Apache-2.0");
    expect(licenses).toContain("GPL-3.0");
  });
});

describe("isOpenSourceLicense", () => {
  it("MIT is OSI approved", () => {
    expect(isOpenSourceLicense("MIT")).toBe(true);
  });

  it("Apache-2.0 is OSI approved", () => {
    expect(isOpenSourceLicense("Apache-2.0")).toBe(true);
  });

  it("unknown is not OSI approved", () => {
    expect(isOpenSourceLicense("unknown")).toBe(false);
  });

  it("Unlicense is not OSI approved", () => {
    expect(isOpenSourceLicense("Unlicense")).toBe(false);
  });
});
