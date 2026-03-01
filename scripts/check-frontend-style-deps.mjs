import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rootPackagePath = join(process.cwd(), 'package.json');
const frontendPackagePath = join(process.cwd(), 'packages/frontend/package.json');

const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
const frontendPackage = JSON.parse(readFileSync(frontendPackagePath, 'utf8'));

const requiredVersions = {
  tailwindcss: '^3.4.19',
  postcss: '^8.5.6',
  autoprefixer: '^10.4.24',
  '@tailwindcss/typography': '^0.5.19',
};

const rootDeps = {
  ...(rootPackage.dependencies ?? {}),
  ...(rootPackage.devDependencies ?? {}),
};

const frontendDeps = frontendPackage.dependencies ?? {};
const frontendDevDeps = frontendPackage.devDependencies ?? {};

const errors = [];

for (const dep of Object.keys(requiredVersions)) {
  if (rootDeps[dep]) {
    errors.push(`Root package must not declare ${dep}; keep frontend style tooling in packages/frontend only.`);
  }
}

for (const [dep, version] of Object.entries(requiredVersions)) {
  if (frontendDeps[dep]) {
    errors.push(`${dep} must be in frontend devDependencies, not dependencies.`);
  }

  if (!frontendDevDeps[dep]) {
    errors.push(`Missing ${dep} in frontend devDependencies.`);
    continue;
  }

  if (frontendDevDeps[dep] !== version) {
    errors.push(`${dep} version mismatch. Expected ${version}, found ${frontendDevDeps[dep]}.`);
  }
}

if (errors.length > 0) {
  console.error('Frontend style dependency alignment check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Frontend style dependency alignment check passed.');
