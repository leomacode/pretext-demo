import { defineConfig, configDefaults } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        // Logic / hook / component state-machine tests. Fast, runs in Node
        // with happy-dom. Canvas is polyfilled (setup.ts) so Pretext's
        // measurement works; happy-dom has no layout engine, so the
        // DOM-vs-Pretext cross-validation lives in the browser project below.
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          globals: true,
          setupFiles: ['./src/__tests__/setup.ts'],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: [...configDefaults.exclude, 'src/__tests__/layout.test.ts'],
        },
      },
      {
        // Cross-validation: Pretext's Canvas math vs the real browser layout
        // engine. Needs a genuine getBoundingClientRect, so it runs in
        // headless Chromium via Playwright — no canvas polyfill needed.
        extends: true,
        test: {
          name: 'browser',
          globals: true,
          include: ['src/__tests__/layout.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
