import { defineConfig } from 'vitest/config';

// Written by HAP Testing's bootstrap. The baseline suite lives in tests/unit.
// tests/hap is where HAP writes the test that has to fail before a fix and pass
// after it; without it in this list those tests never run and no fix here can
// ever be proven.
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/unit/**/*.test.js',
      'tests/hap/**/*.test.ts',
      'tests/hap/**/*.test.tsx',
      'tests/hap/**/*.test.js',
    ],
  },
});
