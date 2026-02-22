import { readFile } from "node:fs/promises";
import path from "node:path";

/** Supported SPDX license identifiers for detection. */
export type LicenseId =
  | "MIT"
  | "Apache-2.0"
  | "GPL-2.0"
  | "GPL-3.0"
  | "LGPL-2.1"
  | "LGPL-3.0"
  | "BSD-2-Clause"
  | "BSD-3-Clause"
  | "MPL-2.0"
  | "ISC"
  | "AGPL-3.0"
  | "Unlicense"
  | "CC0-1.0"
  | "unknown";

/** Result of license detection with confidence score. */
export interface LicenseDetectionResult {
  licenseId: LicenseId;
  confidence: number;
  filePath: string;
  matchedKeywords: string[];
}

/** License signature containing identifying keywords and phrases. */
interface LicenseSignature {
  id: LicenseId;
  keywords: string[];
  negativeKeywords: string[];
}

/**
 * License signatures used for content-based detection.
 * Each signature contains positive and negative keyword matchers.
 */
const LICENSE_SIGNATURES: LicenseSignature[] = [
  {
    id: "MIT",
    keywords: [
      "permission is hereby granted, free of charge",
      "the software is provided \"as is\"",
      "mit license",
    ],
    negativeKeywords: ["apache", "gnu general public"],
  },
  {
    id: "Apache-2.0",
    keywords: [
      "apache license",
      "version 2.0",
      "licensed under the apache license",
    ],
    negativeKeywords: ["gnu general public"],
  },
  {
    id: "GPL-3.0",
    keywords: [
      "gnu general public license",
      "version 3",
      "either version 3 of the license",
    ],
    negativeKeywords: ["lesser general public"],
  },
  {
    id: "GPL-2.0",
    keywords: [
      "gnu general public license",
      "version 2",
      "either version 2 of the license",
    ],
    negativeKeywords: ["version 3", "lesser general public"],
  },
  {
    id: "LGPL-3.0",
    keywords: [
      "gnu lesser general public license",
      "version 3",
    ],
    negativeKeywords: [],
  },
  {
    id: "LGPL-2.1",
    keywords: [
      "gnu lesser general public license",
      "version 2.1",
    ],
    negativeKeywords: [],
  },
  {
    id: "BSD-3-Clause",
    keywords: [
      "redistribution and use in source and binary forms",
      "neither the name of",
      "3-clause",
    ],
    negativeKeywords: ["gnu general public", "mit license"],
  },
  {
    id: "BSD-2-Clause",
    keywords: [
      "redistribution and use in source and binary forms",
      "2-clause",
    ],
    negativeKeywords: ["neither the name of", "gnu general public"],
  },
  {
    id: "MPL-2.0",
    keywords: [
      "mozilla public license",
      "version 2.0",
    ],
    negativeKeywords: [],
  },
  {
    id: "ISC",
    keywords: [
      "isc license",
      "permission to use, copy, modify",
    ],
    negativeKeywords: ["mit license", "apache"],
  },
  {
    id: "AGPL-3.0",
    keywords: [
      "gnu affero general public license",
      "version 3",
    ],
    negativeKeywords: [],
  },
  {
    id: "Unlicense",
    keywords: [
      "this is free and unencumbered software",
      "unlicense",
    ],
    negativeKeywords: [],
  },
  {
    id: "CC0-1.0",
    keywords: [
      "cc0 1.0 universal",
      "creative commons",
      "public domain",
    ],
    negativeKeywords: [],
  },
];

/** File names commonly used for license files in repositories. */
const LICENSE_FILE_NAMES = [
  "LICENSE", "LICENSE.md", "LICENSE.txt",
  "LICENCE", "LICENCE.md", "LICENCE.txt",
  "COPYING", "COPYING.md", "COPYING.txt",
  "LICENSE-MIT", "LICENSE-APACHE",
];

/**
 * Detect the license of a repository by reading license files.
 * Tries multiple common license file names and returns the best match.
 */
export async function detectLicense(
  repoPath: string
): Promise<LicenseDetectionResult> {
  for (const fileName of LICENSE_FILE_NAMES) {
    const filePath = path.join(repoPath, fileName);
    try {
      const content = await readFile(filePath, "utf-8");
      const result = identifyLicense(content, filePath);
      if (result.licenseId !== "unknown") {
        return result;
      }
    } catch {
      continue;
    }
  }

  return {
    licenseId: "unknown",
    confidence: 0,
    filePath: "",
    matchedKeywords: [],
  };
}

/**
 * Identify the license type from file content using keyword matching.
 * Returns the best-matching license with a confidence score.
 */
export function identifyLicense(
  content: string,
  filePath = ""
): LicenseDetectionResult {
  const lowerContent = content.toLowerCase();
  let bestMatch: LicenseDetectionResult = {
    licenseId: "unknown",
    confidence: 0,
    filePath,
    matchedKeywords: [],
  };

  for (const sig of LICENSE_SIGNATURES) {
    const matched: string[] = [];
    let hasNegative = false;

    for (const keyword of sig.keywords) {
      if (lowerContent.includes(keyword)) {
        matched.push(keyword);
      }
    }

    for (const neg of sig.negativeKeywords) {
      if (lowerContent.includes(neg)) {
        hasNegative = true;
        break;
      }
    }

    if (hasNegative) continue;

    const confidence = matched.length / sig.keywords.length;

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        licenseId: sig.id,
        confidence,
        filePath,
        matchedKeywords: matched,
      };
    }
  }

  return bestMatch;
}

/**
 * Get the list of all supported license identifiers.
 * Returns SPDX identifiers that the detector can recognize.
 */
export function getSupportedLicenses(): LicenseId[] {
  return LICENSE_SIGNATURES.map((s) => s.id);
}

/**
 * Check if a specific license is an OSI-approved open source license.
 * Returns true for licenses recognized as open source by OSI.
 */
export function isOpenSourceLicense(licenseId: LicenseId): boolean {
  const osiApproved: LicenseId[] = [
    "MIT", "Apache-2.0", "GPL-2.0", "GPL-3.0",
    "LGPL-2.1", "LGPL-3.0", "BSD-2-Clause", "BSD-3-Clause",
    "MPL-2.0", "ISC", "AGPL-3.0",
  ];
  return osiApproved.includes(licenseId);
}
