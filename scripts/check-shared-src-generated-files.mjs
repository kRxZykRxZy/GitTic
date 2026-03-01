import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const patterns = [
  'packages/shared/src/**/*.js',
  'packages/shared/src/**/*.js.map',
  'packages/shared/src/**/*.d.ts',
  'packages/shared/src/**/*.d.ts.map'
];

const command = `git ls-files -z ${patterns.map((pattern) => `'${pattern}'`).join(' ')}`;
const output = execSync(command, { encoding: 'utf8' });
const trackedFiles = output.split('\0').filter(Boolean).filter((file) => existsSync(file));

if (trackedFiles.length > 0) {
  console.error('Generated artifacts are committed under packages/shared/src.');
  console.error('Keep authoritative sources in TypeScript only and build to packages/shared/dist.');
  console.error('\nTracked generated files:');
  console.error(trackedFiles.join('\n'));
  process.exit(1);
}

console.log('No generated artifacts are committed under packages/shared/src.');
